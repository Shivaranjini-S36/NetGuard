\# NetGuard

\## Network Packet Validation \& Classification System



NetGuard is a web-based application that validates network packet

information and classifies network protocols using a

Deterministic Finite Automaton (DFA).



\## Technologies Used



\- Frontend: React.js

\- Backend: Node.js and Express.js

\- Database: MongoDB

\- Automata: Deterministic Finite Automaton

\- Validation: Regular Expressions and validation rules



\## Features



\- Validate source and destination IPv4 addresses.

\- Validate source and destination port numbers.

\- Classify TCP, UDP and ICMP protocols using DFA.

\- Identify unsupported protocols.

\- Store packet records in MongoDB.

\- Display valid and invalid packets.

\- Search packet records.

\- Display validation errors.

\- Show the DFA state transition diagram and table.



\## DFA Design



\*\*States:\*\* q0, q1, q2, q3, qReject



\*\*Initial State:\*\* q0



\*\*Final States:\*\* q1, q2, q3



\*\*Input Alphabet:\*\* TCP, UDP, ICMP, OTHER



\### State Transition Table



| State | TCP | UDP | ICMP | OTHER |

|---|---|---|---|---|

| q0 | q1 | q2 | q3 | qReject |

| q1 | qReject | qReject | qReject | qReject |

| q2 | qReject | qReject | qReject | qReject |

| q3 | qReject | qReject | qReject | qReject |

| qReject | qReject | qReject | qReject | qReject |



The DFA classifies one protocol token at a time.

IP address and port validation are performed separately.



\## Project Structure



\- client/ - React frontend

\- server/ - Express backend

\- README.md - Project documentation



\## Run the Project Locally



\### 1. Start the backend



Open a terminal:



```bash

cd server

npm install

