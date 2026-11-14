
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

// ------------------------------
// 1. MIDDLEWARE
// ------------------------------

app.use(cors())
app.use(express.json())

// ------------------------------
// 2. PACKET DATABASE SCHEMA
// ------------------------------

const packetSchema = new mongoose.Schema({
  sourceIP: {
    type: String,
    required: true,
  },

  destinationIP: {
    type: String,
    required: true,
  },

  protocol: {
    type: String,
    required: true,
  },

  sourcePort: {
    type: String,
    default: 'N/A',
  },

  destinationPort: {
    type: String,
    default: 'N/A',
  },

  classification: {
    type: String,
    required: true,
  },

  dfaState: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    required: true,
  },

  validationErrors: {
    type: [String],
    default: [],
  },

}, { timestamps: true })

const Packet = mongoose.model('Packet', packetSchema)

// ------------------------------
// 3. IPV4 ADDRESS VALIDATION
// ------------------------------

function isValidIP(ip) {
  const octet = '(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])'

  const ipRegex = new RegExp(
    `^${octet}(\\.${octet}){3}$`
  )

  return typeof ip === 'string' && ipRegex.test(ip)
}

// ------------------------------
// 4. PORT NUMBER VALIDATION
// ------------------------------

function isValidPort(port) {
  if (
    port === null ||
    port === undefined ||
    String(port).trim() === ''
  ) {
    return false
  }

  const value = String(port)

  return (
    /^\d+$/.test(value) &&
    Number(value) >= 0 &&
    Number(value) <= 65535
  )
}

// ------------------------------
// 5. DFA PROTOCOL CLASSIFICATION
// ------------------------------

const transitionTable = {
  q0: {
    TCP: 'q1',
    UDP: 'q2',
    ICMP: 'q3',
    OTHER: 'qReject',
  },

  q1: {
    TCP: 'qReject',
    UDP: 'qReject',
    ICMP: 'qReject',
    OTHER: 'qReject',
  },

  q2: {
    TCP: 'qReject',
    UDP: 'qReject',
    ICMP: 'qReject',
    OTHER: 'qReject',
  },

  q3: {
    TCP: 'qReject',
    UDP: 'qReject',
    ICMP: 'qReject',
    OTHER: 'qReject',
  },

  qReject: {
    TCP: 'qReject',
    UDP: 'qReject',
    ICMP: 'qReject',
    OTHER: 'qReject',
  },
}

const finalStates = ['q1', 'q2', 'q3']

function classifyProtocol(protocol) {
  const input = typeof protocol === 'string'
    ? protocol.trim().toUpperCase()
    : ''

  const symbol = ['TCP', 'UDP', 'ICMP'].includes(input)
    ? input
    : 'OTHER'

  const finalState = transitionTable.q0[symbol]

  const accepted = finalStates.includes(finalState)

  return {
    classification: accepted ? input : 'Unknown',
    finalState,
    accepted,
    protocol: input,
  }
}

// ------------------------------
// 6. TEST BACKEND ROUTE
// ------------------------------

app.get('/', (req, res) => {
  res.send('NetGuard Backend is running!')
})

// ------------------------------
// 7. SAVE PACKET
// ------------------------------

app.post('/api/packets', async (req, res) => {
  try {
    const {
      sourceIP,
      destinationIP,
      protocol,
      sourcePort,
      destinationPort,
    } = req.body || {}

    const errors = []

    // Validate required fields
    if (typeof sourceIP !== 'string' || !sourceIP.trim()) {
      errors.push('Source IP address is required.')
    }

    if (typeof destinationIP !== 'string' || !destinationIP.trim()) {
      errors.push('Destination IP address is required.')
    }

    if (typeof protocol !== 'string' || !protocol.trim()) {
      errors.push('Protocol is required.')
    }

    const safeSourceIP = typeof sourceIP === 'string'
      ? sourceIP.trim()
      : ''

    const safeDestinationIP = typeof destinationIP === 'string'
      ? destinationIP.trim()
      : ''

    const safeProtocol = typeof protocol === 'string'
      ? protocol.trim().toUpperCase()
      : ''

    // Validate source IP
    if (safeSourceIP && !isValidIP(safeSourceIP)) {
      errors.push('Invalid source IP address.')
    }

    // Validate destination IP
    if (safeDestinationIP && !isValidIP(safeDestinationIP)) {
      errors.push('Invalid destination IP address.')
    }

    // Classify protocol using DFA
    const dfaResult = classifyProtocol(safeProtocol)

    if (safeProtocol && !dfaResult.accepted) {
      errors.push('Unsupported network protocol.')
    }

    let finalSourcePort = 'N/A'
    let finalDestinationPort = 'N/A'

    // Validate TCP and UDP ports
    if (safeProtocol === 'TCP' || safeProtocol === 'UDP') {
      if (!isValidPort(sourcePort)) {
        errors.push('Source port must be between 0 and 65535.')
      } else {
        finalSourcePort = String(sourcePort)
      }

      if (!isValidPort(destinationPort)) {
        errors.push('Destination port must be between 0 and 65535.')
      } else {
        finalDestinationPort = String(destinationPort)
      }
    }

    // ICMP does not use TCP or UDP ports
    if (safeProtocol === 'ICMP') {
      finalSourcePort = 'N/A'
      finalDestinationPort = 'N/A'
    }

    // Create packet
    const packet = new Packet({
      sourceIP: safeSourceIP,
      destinationIP: safeDestinationIP,
      protocol: safeProtocol || 'Unknown',
      sourcePort: finalSourcePort,
      destinationPort: finalDestinationPort,
      classification: dfaResult.classification,
      dfaState: dfaResult.finalState,
      status: errors.length === 0 ? 'Valid' : 'Invalid',
      validationErrors: errors,
    })

    const savedPacket = await packet.save()

    // Display saved packet in terminal
    console.log('\n========== NEW PACKET SAVED ==========')
    console.log('Source IP        :', savedPacket.sourceIP)
    console.log('Destination IP   :', savedPacket.destinationIP)
    console.log('Protocol         :', savedPacket.protocol)
    console.log('Source Port      :', savedPacket.sourcePort)
    console.log('Destination Port :', savedPacket.destinationPort)
    console.log('Classification   :', savedPacket.classification)
    console.log('DFA State        :', savedPacket.dfaState)
    console.log('Status           :', savedPacket.status)
    console.log('Validation Errors:', savedPacket.validationErrors)
    console.log('======================================\n')

    res.status(201).json({
      message: 'Packet saved successfully',
      packet: savedPacket,
    })

  } catch (error) {
    console.error('Packet saving error:', error.message)

    res.status(500).json({
      message: 'Error saving packet',
      error: error.message,
    })
  }
})

// ------------------------------
// 8. RETRIEVE ALL PACKETS
// ------------------------------

app.get('/api/packets', async (req, res) => {
  try {
    const packets = await Packet.find().sort({ createdAt: -1 })

    console.log('Total packets retrieved:', packets.length)

    res.json(packets)

  } catch (error) {
    console.error('Fetching error:', error.message)

    res.status(500).json({
      message: 'Error fetching packets',
      error: error.message,
    })
  }
})

// ------------------------------
// 9. CONNECT MONGODB AND START SERVER
// ------------------------------

const PORT = process.env.PORT || 5000

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing. Please configure your environment variable.')
  process.exit(1)
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully!')

    app.listen(PORT, () => {
      console.log(`NetGuard backend running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })
