
const states = {
  START: 'q0',
  TCP: 'q1',
  UDP: 'q2',
  ICMP: 'q3',
  REJECT: 'qReject',
}

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

export function classifyProtocol(protocol) {
  const input = String(protocol).trim().toUpperCase()

  const symbol = ['TCP', 'UDP', 'ICMP'].includes(input)
    ? input
    : 'OTHER'

  let currentState = states.START

  currentState = transitionTable[currentState][symbol]

  const accepted = finalStates.includes(currentState)

  return {
    classification: accepted ? input : 'Unknown',
    finalState: currentState,
    accepted,
  }
}
