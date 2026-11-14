
import { useState, useEffect } from 'react'
import './App.css'
import { classifyProtocol } from './automata'

const API_URL = 'http://localhost:5000/api/packets'

// ------------------------------
// 1. INPUT VALIDATION
// ------------------------------

function isValidIP(ip) {
  const octet = '(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])'
  const ipRegex = new RegExp(`^${octet}(\\.${octet}){3}$`)

  return typeof ip === 'string' && ipRegex.test(ip)
}

function isValidPort(port) {
  if (port === null || port === undefined || String(port).trim() === '') {
    return false
  }

  return (
    /^\d+$/.test(String(port)) &&
    Number(port) >= 0 &&
    Number(port) <= 65535
  )
}

// ------------------------------
// 2. FORMAT MONGODB PACKET
// ------------------------------

function formatPacket(packet) {
  return {
    id: packet._id,
    source: packet.sourceIP,
    destination: packet.destinationIP,
    protocol: packet.protocol,
    sourcePort: packet.sourcePort,
    destinationPort: packet.destinationPort,
    classification: packet.classification,
    dfaState: packet.dfaState,
    status: packet.status,
    errors: packet.validationErrors || [],
  }
}

// ------------------------------
// 3. DFA STATE TRANSITION DIAGRAM
// ------------------------------

function DfaDiagram({ protocol }) {
  const result = classifyProtocol(protocol)
  const activeState = result.finalState

  const isActive = (state) => activeState === state

  const activeColor = '#16865c'
  const normalColor = '#64748b'
  const rejectColor = '#dc2626'

  const edgeColor = (state) =>
    isActive(state) ? activeColor : normalColor

  return (
    <section className="panel dfa-panel">
      <h2>DFA State Transition Diagram</h2>

      <p>
        The diagram classifies the selected protocol using a
        Deterministic Finite Automaton.
      </p>

      <div className="dfa-result">
        <strong>Selected Input:</strong> {String(protocol).toUpperCase()}
        <br />
        <strong>Final State:</strong> {activeState}
        <br />
        <strong>Classification:</strong> {result.classification}
      </div>

      <div className="dfa-scroll">
        <svg
          className="dfa-svg"
          viewBox="0 0 760 390"
          role="img"
          aria-label="Complete DFA state transition diagram for TCP, UDP, ICMP and unsupported protocols"
        >
          <defs>
            <marker
              id="dfaArrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0 0 L8 4 L0 8 Z" fill="#64748b" />
            </marker>
          </defs>

          {/* Initial arrow */}
          <path
            d="M15 185 L78 185"
            stroke={normalColor}
            strokeWidth="2.5"
            fill="none"
            markerEnd="url(#dfaArrow)"
          />

          {/* q0 to q1: TCP */}
          <path
            d="M128 165 Q205 65 298 65"
            stroke={edgeColor('q1')}
            strokeWidth={isActive('q1') ? 4 : 2.5}
            fill="none"
            markerEnd="url(#dfaArrow)"
          />
          <text x="205" y="85" className="dfa-edge-label">
            TCP
          </text>

          {/* q0 to q2: UDP */}
          <path
            d="M145 185 L298 185"
            stroke={edgeColor('q2')}
            strokeWidth={isActive('q2') ? 4 : 2.5}
            fill="none"
            markerEnd="url(#dfaArrow)"
          />
          <text x="215" y="174" className="dfa-edge-label">
            UDP
          </text>

          {/* q0 to q3: ICMP */}
          <path
            d="M128 205 Q205 305 298 305"
            stroke={edgeColor('q3')}
            strokeWidth={isActive('q3') ? 4 : 2.5}
            fill="none"
            markerEnd="url(#dfaArrow)"
          />
          <text x="205" y="285" className="dfa-edge-label">
            ICMP
          </text>

          {/* q0 to qReject: OTHER */}
          <path
            d="M105 155 Q190 5 500 105 Q545 120 575 155"
            stroke={isActive('qReject') ? rejectColor : normalColor}
            strokeWidth={isActive('qReject') ? 4 : 2.5}
            fill="none"
            markerEnd="url(#dfaArrow)"
          />
          <text x="340" y="35" className="dfa-edge-label">
            OTHER
          </text>

          {/* q1 to qReject: any further symbol */}
          <path
            d="M342 65 Q465 65 578 160"
            stroke={normalColor}
            strokeWidth="2"
            fill="none"
            markerEnd="url(#dfaArrow)"
          />

          {/* q2 to qReject: any further symbol */}
          <path
            d="M342 185 L570 185"
            stroke={normalColor}
            strokeWidth="2"
            fill="none"
            markerEnd="url(#dfaArrow)"
          />

          {/* q3 to qReject: any further symbol */}
          <path
            d="M342 305 Q465 305 578 210"
            stroke={normalColor}
            strokeWidth="2"
            fill="none"
            markerEnd="url(#dfaArrow)"
          />

          <text x="435" y="95" className="dfa-small-label">
            Any further symbol
          </text>
          <text x="425" y="172" className="dfa-small-label">
            Any further symbol
          </text>
          <text x="435" y="285" className="dfa-small-label">
            Any further symbol
          </text>

          {/* Rejection state self-loop */}
          <path
            d="M600 153 Q690 75 700 155 Q708 210 625 220"
            stroke={isActive('qReject') ? rejectColor : normalColor}
            strokeWidth={isActive('qReject') ? 4 : 2.5}
            fill="none"
            markerEnd="url(#dfaArrow)"
          />
          <text x="682" y="85" className="dfa-small-label">
            Any input
          </text>

          {/* Initial state q0 */}
          <circle
            cx="110"
            cy="185"
            r="32"
            fill="#ffffff"
            stroke={normalColor}
            strokeWidth="3"
          />
          <text x="110" y="190" textAnchor="middle" className="dfa-state-text">
            q0
          </text>
          <text x="110" y="235" textAnchor="middle" className="dfa-small-label">
            Initial State
          </text>

          {/* Accepting state q1 */}
          <circle
            cx="320"
            cy="65"
            r="24"
            fill={isActive('q1') ? '#dcfce7' : '#ffffff'}
            stroke={edgeColor('q1')}
            strokeWidth="3"
          />
          <circle
            cx="320"
            cy="65"
            r="19"
            fill="none"
            stroke={edgeColor('q1')}
            strokeWidth="2"
          />
          <text x="320" y="70" textAnchor="middle" className="dfa-state-text">
            q1
          </text>
          <text x="320" y="105" textAnchor="middle" className="dfa-small-label">
            TCP Accept
          </text>

          {/* Accepting state q2 */}
          <circle
            cx="320"
            cy="185"
            r="24"
            fill={isActive('q2') ? '#dcfce7' : '#ffffff'}
            stroke={edgeColor('q2')}
            strokeWidth="3"
          />
          <circle
            cx="320"
            cy="185"
            r="19"
            fill="none"
            stroke={edgeColor('q2')}
            strokeWidth="2"
          />
          <text x="320" y="190" textAnchor="middle" className="dfa-state-text">
            q2
          </text>
          <text x="320" y="225" textAnchor="middle" className="dfa-small-label">
            UDP Accept
          </text>

          {/* Accepting state q3 */}
          <circle
            cx="320"
            cy="305"
            r="24"
            fill={isActive('q3') ? '#dcfce7' : '#ffffff'}
            stroke={edgeColor('q3')}
            strokeWidth="3"
          />
          <circle
            cx="320"
            cy="305"
            r="19"
            fill="none"
            stroke={edgeColor('q3')}
            strokeWidth="2"
          />
          <text x="320" y="310" textAnchor="middle" className="dfa-state-text">
            q3
          </text>
          <text x="320" y="345" textAnchor="middle" className="dfa-small-label">
            ICMP Accept
          </text>

          {/* Rejection state */}
          <circle
            cx="600"
            cy="185"
            r="32"
            fill={isActive('qReject') ? '#fee2e2' : '#ffffff'}
            stroke={isActive('qReject') ? rejectColor : normalColor}
            strokeWidth="3"
          />
          <text x="600" y="190" textAnchor="middle" className="dfa-state-text">
            R
          </text>
          <text x="600" y="240" textAnchor="middle" className="dfa-small-label">
            qReject
          </text>
        </svg>
      </div>

      <div className="dfa-legend">
        <span>○ Initial state</span>
        <span>◎ Accepting state</span>
        <span>Red = Rejection state</span>
        <span>Green = Active path</span>
      </div>

      <h3>State Transition Table</h3>

      <div className="table-wrapper">
        <table className="dfa-table">
          <thead>
            <tr>
              <th>Current State</th>
              <th>TCP</th>
              <th>UDP</th>
              <th>ICMP</th>
              <th>OTHER</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>q0</td>
              <td>q1</td>
              <td>q2</td>
              <td>q3</td>
              <td>qReject</td>
            </tr>
            <tr>
              <td>q1</td>
              <td>qReject</td>
              <td>qReject</td>
              <td>qReject</td>
              <td>qReject</td>
            </tr>
            <tr>
              <td>q2</td>
              <td>qReject</td>
              <td>qReject</td>
              <td>qReject</td>
              <td>qReject</td>
            </tr>
            <tr>
              <td>q3</td>
              <td>qReject</td>
              <td>qReject</td>
              <td>qReject</td>
              <td>qReject</td>
            </tr>
            <tr>
              <td>qReject</td>
              <td>qReject</td>
              <td>qReject</td>
              <td>qReject</td>
              <td>qReject</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="dfa-description">
        <p><strong>Initial State:</strong> q0</p>
        <p><strong>Final States:</strong> q1, q2, q3</p>
        <p><strong>Input Alphabet:</strong> TCP, UDP, ICMP, OTHER</p>
        <p>
          The DFA processes one protocol token at a time.
          IP addresses and port numbers are validated separately.
          Any additional input after an accepting state leads to qReject.
        </p>
      </div>
    </section>
  )
}

// ------------------------------
// 4. MAIN NETGUARD APPLICATION
// ------------------------------

function App() {
  const [packets, setPackets] = useState([])

  const [search, setSearch] = useState('')
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState('')
  const [protocol, setProtocol] = useState('TCP')

  // Tracks which packet's DFA path should be highlighted
  const [diagramProtocol, setDiagramProtocol] = useState('TCP')

  const [sourcePort, setSourcePort] = useState('')
  const [destinationPort, setDestinationPort] = useState('')

  const [message, setMessage] = useState('')
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ------------------------------
  // FETCH PACKETS FROM MONGODB
  // ------------------------------

  useEffect(() => {
    async function fetchPackets() {
      try {
        const response = await fetch(API_URL)

        if (!response.ok) {
          throw new Error('Unable to retrieve packets from the server.')
        }

        const data = await response.json()

        setPackets(data.map(formatPacket))
        setApiError('')
      } catch (error) {
        console.error('Fetching packets error:', error)

        setApiError(
          'Unable to connect to the backend. Please check whether the server is running.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchPackets()
  }, [])

  // ------------------------------
  // ADD AND VALIDATE PACKET
  // ------------------------------

  async function addPacket(event) {
    event.preventDefault()

    setMessage('')
    setApiError('')

    const errors = []

    // Validate IP addresses
    if (!isValidIP(source.trim())) {
      errors.push('Invalid source IP address.')
    }

    if (!isValidIP(destination.trim())) {
      errors.push('Invalid destination IP address.')
    }

    // Classify protocol using DFA
    const dfaResult = classifyProtocol(protocol)

    if (!dfaResult.accepted) {
      errors.push('Unsupported network protocol.')
    }

    // Validate TCP and UDP ports
    if (protocol === 'TCP' || protocol === 'UDP') {
      if (!isValidPort(sourcePort)) {
        errors.push('Source port must be between 0 and 65535.')
      }

      if (!isValidPort(destinationPort)) {
        errors.push('Destination port must be between 0 and 65535.')
      }
    }

    // Prepare packet for backend
    const newPacket = {
      sourceIP: source.trim(),
      destinationIP: destination.trim(),
      protocol,
      sourcePort: protocol === 'ICMP' ? 'N/A' : sourcePort,
      destinationPort: protocol === 'ICMP' ? 'N/A' : destinationPort,
      classification: dfaResult.classification,
      dfaState: dfaResult.finalState,
      status: errors.length === 0 ? 'Valid' : 'Invalid',
      validationErrors: errors,
    }

    try {
      setIsSaving(true)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPacket),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save packet.')
      }

      const savedPacket = formatPacket(data.packet)

      // Update dashboard with MongoDB record
      setPackets(previous => [savedPacket, ...previous])

      // Keep the submitted packet's DFA path highlighted
      setDiagramProtocol(savedPacket.protocol)

      setMessage(
        savedPacket.status === 'Valid'
          ? `Packet saved successfully! Classified as ${savedPacket.classification}.`
          : 'Packet saved, but validation failed. Check the validation errors.'
      )

      // Clear form
      setSource('')
      setDestination('')
      setProtocol('TCP')
      setSourcePort('')
      setDestinationPort('')

    } catch (error) {
      console.error('Saving packet error:', error)

      setApiError(
        error.message || 'Unable to save packet. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  // ------------------------------
  // SEARCH PACKETS
  // ------------------------------

  const filteredPackets = packets.filter(packet =>
    Object.values(packet).some(value =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  )

  // ------------------------------
  // DASHBOARD STATISTICS
  // ------------------------------

  const validCount = packets.filter(
    packet => packet.status === 'Valid'
  ).length

  const invalidCount = packets.filter(
    packet => packet.status === 'Invalid'
  ).length

  // ------------------------------
  // USER INTERFACE
  // ------------------------------

  return (
    <div className="app">

      {/* Header */}
      <header className="header">
        <div>
          <h1>NetGuard</h1>
          <p>Network Packet Validation & Classification System</p>
        </div>

        <span className="online">● System Online</span>
      </header>

      <main className="container">

        {/* Dashboard introduction */}
        <section className="welcome">
          <h2>Network Packet Dashboard</h2>
          <p>Validate, classify and monitor network packet records.</p>
        </section>

        {/* Backend errors */}
        {apiError && (
          <p className="result-message">{apiError}</p>
        )}

        {/* Dashboard statistics */}
        <section className="stats">
          <div className="stat-card">
            <h3>Total Packets</h3>
            <p>{packets.length}</p>
          </div>

          <div className="stat-card">
            <h3>Valid Packets</h3>
            <p>{validCount}</p>
          </div>

          <div className="stat-card">
            <h3>Invalid Packets</h3>
            <p>{invalidCount}</p>
          </div>
        </section>

        {/* COMPLETE DFA DIAGRAM AND TRANSITION TABLE */}
        <DfaDiagram protocol={diagramProtocol} />

        {/* Add Packet Form */}
        <section className="panel">
          <h2>Add Network Packet</h2>

          <form onSubmit={addPacket} className="packet-form">

            <label>Source IP Address</label>
            <input
              type="text"
              placeholder="Example: 192.168.1.10"
              value={source}
              onChange={e => setSource(e.target.value)}
              required
            />

            <label>Destination IP Address</label>
            <input
              type="text"
              placeholder="Example: 192.168.1.20"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              required
            />

            <label>Protocol</label>
            <select
              value={protocol}
              onChange={e => {
                setProtocol(e.target.value)
                setDiagramProtocol(e.target.value)
              }}
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>

            {protocol !== 'ICMP' && (
              <>
                <label>Source Port</label>
                <input
                  type="number"
                  min="0"
                  max="65535"
                  placeholder="Example: 5050"
                  value={sourcePort}
                  onChange={e => setSourcePort(e.target.value)}
                  required
                />

                <label>Destination Port</label>
                <input
                  type="number"
                  min="0"
                  max="65535"
                  placeholder="Example: 443"
                  value={destinationPort}
                  onChange={e => setDestinationPort(e.target.value)}
                  required
                />
              </>
            )}

            {protocol === 'ICMP' && (
              <p className="info-message">
                ICMP does not use TCP or UDP port numbers.
              </p>
            )}

            <button
              type="submit"
              className="add-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving Packet...' : 'Validate and Add Packet'}
            </button>

          </form>

          {message && (
            <p className="result-message">{message}</p>
          )}
        </section>

        {/* Packet Records */}
        <section className="panel">
          <h2>Packet Records</h2>

          <input
            type="text"
            placeholder="Search packets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search"
          />

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Source Address</th>
                  <th>Destination Address</th>
                  <th>Protocol</th>
                  <th>Classification</th>
                  <th>DFA State</th>
                  <th>Source Port</th>
                  <th>Destination Port</th>
                  <th>Status</th>
                  <th>DFA View</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="9">Loading packets...</td>
                  </tr>
                ) : filteredPackets.length === 0 ? (
                  <tr>
                    <td colSpan="9">No packets found.</td>
                  </tr>
                ) : (
                  filteredPackets.map(packet => (
                    <tr key={packet.id}>
                      <td>{packet.source}</td>
                      <td>{packet.destination}</td>
                      <td>{packet.protocol}</td>
                      <td>{packet.classification}</td>
                      <td>{packet.dfaState}</td>
                      <td>{packet.sourcePort}</td>
                      <td>{packet.destinationPort}</td>
                      <td>
                        <span
                          className={
                            packet.status === 'Valid' ? 'valid' : 'invalid'
                          }
                        >
                          {packet.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="dfa-view-button"
                          onClick={() => setDiagramProtocol(packet.protocol)}
                        >
                          View DFA
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Validation Errors */}
        <section className="panel">
          <h2>Validation Errors</h2>

          {packets.filter(packet => packet.errors.length > 0).length === 0 ? (
            <p>No validation errors found.</p>
          ) : (
            packets
              .filter(packet => packet.errors.length > 0)
              .map(packet => (
                <div key={packet.id}>
                  <strong>Packet {packet.id}:</strong>
                  <ul>
                    {packet.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))
          )}
        </section>

        {/* Footer */}
        <footer>
          <p>NetGuard | Network Packet Validation System</p>
        </footer>

      </main>
    </div>
  )
}

export default App
