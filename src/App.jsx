import { useMemo, useState, useEffect } from 'react'
import { processCitizenReport, getAIExplanation, LANDMARKS } from './triageEngine'

const initialIncidents = [
  {
    id: 'INC-1048',
    type: 'Live electrical wire',
    icon: '⚡',
    location: 'Maitrivanam junction, Ameerpet',
    time: '4 min ago',
    priority: 'Critical',
    score: 94,
    reports: 3,
    route: 'Balkampet Road',
    eta: '12 min',
    team: 'Electrical Emergency Team 02',
    reason: 'Live wire in standing water, three matching reports, and an ambulance route is affected.',
    factors: ['Threat to life', '3 corroborating reports', 'Emergency route affected'],
    status: 'Awaiting approval',
    x: 66,
    y: 29,
    linkedReports: [
      { id: 'REP-001', name: 'Kiran Kumar', phone: '9876543210', description: 'Sparking wire fell into the water near Maitrivanam.', timestamp: '10 min ago' },
      { id: 'REP-002', name: 'Anitha R.', phone: '9848022338', description: 'Live cable sparking on flooded road.', timestamp: '7 min ago' },
      { id: 'REP-003', name: 'Suresh P.', phone: '9000123456', description: 'Please send help, electrical sparks in water.', timestamp: '4 min ago' }
    ]
  },
  {
    id: 'INC-1047',
    type: 'Stranded residents',
    icon: '🛟',
    location: 'Buddhanagar, Lane 3',
    time: '8 min ago',
    priority: 'High',
    score: 82,
    reports: 5,
    route: 'Srinivasa Nagar Road',
    eta: '9 min',
    team: 'Disaster Response Unit 01',
    reason: 'Five reports describe two elderly residents unable to leave a flooded ground-floor home.',
    factors: ['Vulnerable residents', '5 corroborating reports', 'Water entering homes'],
    status: 'Awaiting approval',
    x: 37,
    y: 55,
    linkedReports: [
      { id: 'REP-004', name: 'Rajesh V.', phone: '9111222333', description: 'Elderly couple stuck on ground floor. Water at 2 feet.', timestamp: '8 min ago' }
    ]
  },
  {
    id: 'INC-1046',
    type: 'Blocked drainage',
    icon: '🕳️',
    location: 'Balkampet Main Road',
    time: '13 min ago',
    priority: 'Medium',
    score: 61,
    reports: 2,
    route: 'Balkampet Main Road',
    eta: '18 min',
    team: 'Drainage Response Team 04',
    reason: 'Drain cover blockage is worsening waterlogging but no immediate danger to people is reported.',
    factors: ['2 corroborating reports', 'Increasing water depth', 'Main-road impact'],
    status: 'Awaiting approval',
    x: 72,
    y: 70,
    linkedReports: [
      { id: 'REP-005', name: 'Mohammad', phone: '9555666777', description: 'Large plastic block in stormwater drain.', timestamp: '13 min ago' }
    ]
  },
  {
    id: 'INC-1045',
    type: 'Waterlogged road',
    icon: '🌊',
    location: 'Ameerpet Metro approach',
    time: '18 min ago',
    priority: 'Low',
    score: 38,
    reports: 1,
    route: 'Metro service lane',
    eta: '22 min',
    team: 'Traffic Diversion Team 03',
    reason: 'One report indicates slow traffic. Nearby reports do not yet corroborate a full road blockage.',
    factors: ['Single report', 'Traffic disruption', 'Needs verification'],
    status: 'Needs verification',
    x: 22,
    y: 31,
    linkedReports: [
      { id: 'REP-006', name: 'David L.', phone: '9222333444', description: 'Water building up near metro steps.', timestamp: '18 min ago' }
    ]
  },
]

const initialTeams = [
  { name: 'Electrical Emergency Team 02', icon: '⚡', skill: 'Power Grid Isolation', status: 'Idle', baseEta: 12, logs: ['System standby'] },
  { name: 'Disaster Response Unit 01', icon: '🛟', skill: 'Search, Rescue & Boats', status: 'Idle', baseEta: 9, logs: ['Ready for dispatch'] },
  { name: 'Drainage Response Team 04', icon: '🕳️', skill: 'High-Volume Pumps', status: 'Idle', baseEta: 18, logs: ['Maintenance complete'] },
  { name: 'Traffic Diversion Team 03', icon: '🌊', skill: 'Signage & Detours', status: 'Idle', baseEta: 22, logs: ['Patrolling sector'] }
]

function App() {
  // Load State from LocalStorage
  const [incidents, setIncidents] = useState(() => {
    const saved = localStorage.getItem('nxtwave_incidents')
    return saved ? JSON.parse(saved) : initialIncidents
  })
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('nxtwave_teams')
    return saved ? JSON.parse(saved) : initialTeams
  })
  const [weatherAlert, setWeatherAlert] = useState(() => {
    return localStorage.getItem('nxtwave_weather') || 'Green'
  })
  const [selectedId, setSelectedId] = useState('INC-1048')
  const [view, setView] = useState('Control room')
  const [offlineMode, setOfflineMode] = useState(false)
  const [offlineQueue, setOfflineQueue] = useState([])
  const [notification, setNotification] = useState(null)

  // AI Assistant Explainer Chat Drawer state
  const [aiExplainOpen, setAiExplainOpen] = useState(false)
  const [aiChatMessages, setAiChatMessages] = useState([])

  // Live Dispatch Animation coordinates state
  const [dispatchAnimations, setDispatchAnimations] = useState({})

  // Form State
  const [citizenForm, setCitizenForm] = useState({
    name: '',
    phone: '',
    location: 'Maitrivanam junction, Ameerpet',
    type: 'waterlogging',
    description: '',
    vulnerable: false,
    urgent: false
  })
  const [simulationLog, setSimulationLog] = useState([])

  // Filter state for Map view
  const [mapPriorityFilter, setMapPriorityFilter] = useState('All')
  const [mapStatusFilter, setMapStatusFilter] = useState('All')

  // Save State to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('nxtwave_incidents', JSON.stringify(incidents))
  }, [incidents])

  useEffect(() => {
    localStorage.setItem('nxtwave_teams', JSON.stringify(teams))
  }, [teams])

  useEffect(() => {
    localStorage.setItem('nxtwave_weather', weatherAlert)
  }, [weatherAlert])

  // Trigger brief alert notifications
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Animation ticker for active dispatches
  useEffect(() => {
    const activeDispatches = Object.keys(dispatchAnimations).filter(id => dispatchAnimations[id].progress < 100)
    if (activeDispatches.length === 0) return

    const interval = setInterval(() => {
      setDispatchAnimations(prev => {
        const next = { ...prev }
        let updated = false
        for (const id of activeDispatches) {
          const current = next[id]
          if (current.progress < 100) {
            const nextProgress = Math.min(100, current.progress + 5)
            // Interpolate from depot (50%, 50%) to the incident's coordinates
            const x = 50 + ((current.targetX - 50) * nextProgress) / 100
            const y = 50 + ((current.targetY - 50) * nextProgress) / 100
            next[id] = { ...current, x, y, progress: nextProgress }
            updated = true
            
            if (nextProgress === 100) {
              // Update log that vehicle has arrived
              setTeams(prevTeams => prevTeams.map(t => 
                t.name === current.teamName 
                  ? { ...t, logs: [`Arrived at ${id}`, ...t.logs] }
                  : t
              ))
            }
          }
        }
        return updated ? next : prev
      })
    }, 300)

    return () => clearInterval(interval)
  }, [dispatchAnimations])

  // Process Offline Queue when back online
  useEffect(() => {
    if (!offlineMode && offlineQueue.length > 0) {
      showNotification(`Reconnected! Processing ${offlineQueue.length} queued offline report(s).`, 'success')
      
      setIncidents(prevIncidents => {
        let currentIncidents = [...prevIncidents]
        offlineQueue.forEach(report => {
          const result = processCitizenReport(report, currentIncidents, weatherAlert)
          if (result.isDuplicate) {
            currentIncidents = currentIncidents.map(inc => 
              inc.id === result.matchedId ? result.updatedIncident : inc
            )
          } else {
            currentIncidents.push(result.newIncident)
          }
        })
        return currentIncidents
      })
      
      setOfflineQueue([])
    }
  }, [offlineMode, offlineQueue, weatherAlert])

  const selected = incidents.find((incident) => incident.id === selectedId) ?? incidents[0]
  const activeCount = incidents.filter((incident) => incident.status === 'Awaiting approval').length
  const approvedCount = incidents.filter((incident) => incident.status === 'Team dispatched').length

  const sortedIncidents = useMemo(
    () => [...incidents].sort((a, b) => b.score - a.score),
    [incidents],
  )

  // Resource Overlap Checker: checks if a team is already dispatched elsewhere
  const activeConflict = useMemo(() => {
    if (!selected || selected.status === 'Team dispatched') return null
    const duplicateAssignment = incidents.find(
      i => i.status === 'Team dispatched' && i.team === selected.team
    )
    return duplicateAssignment ? duplicateAssignment : null
  }, [selected, incidents])

  // Dispatch approval
  const approveResponse = () => {
    if (!selected) return

    // Update incident status
    setIncidents((current) => current.map((incident) => (
      incident.id === selected.id
        ? { ...incident, status: 'Team dispatched', time: 'Just now' }
        : incident
    )))

    // Update team status
    setTeams(current => current.map(t => 
      t.name === selected.team
        ? { ...t, status: 'Dispatched', logs: [`Dispatched to ${selected.id} via ${selected.route}`, ...t.logs] }
        : t
    ))

    // Initialize animation (starts at center 50%, 50% depot)
    setDispatchAnimations(prev => ({
      ...prev,
      [selected.id]: {
        x: 50,
        y: 50,
        targetX: selected.x,
        targetY: selected.y,
        progress: 0,
        teamName: selected.team,
        icon: selected.icon
      }
    }))

    showNotification(`Emergency Dispatch Approved for ${selected.id}!`, 'success')
  }

  // Resolve incident
  const resolveIncident = (id) => {
    const inc = incidents.find(i => i.id === id)
    if (!inc) return

    setIncidents(current => current.map(incident => 
      incident.id === id
        ? { ...incident, status: 'Resolved' }
        : incident
    ))

    // Set team back to idle
    setTeams(current => current.map(t => 
      t.name === inc.team
        ? { ...t, status: 'Idle', logs: [`Completed response at ${id}`, ...t.logs] }
        : t
    ))

    showNotification(`Incident ${id} marked as Resolved. Team released.`, 'info')
  }

  // Override / Modify priority manually
  const overridePriority = (id, newPriority) => {
    let multiplier = 1.0
    if (newPriority === 'Critical') multiplier = 1.2
    else if (newPriority === 'High') multiplier = 1.0
    else if (newPriority === 'Medium') multiplier = 0.8
    else multiplier = 0.5

    setIncidents(current => current.map(incident => {
      if (incident.id === id) {
        const revisedScore = Math.min(100, Math.round(incident.score * multiplier))
        return { 
          ...incident, 
          priority: newPriority, 
          score: revisedScore,
          factors: [...incident.factors, `Operator override to ${newPriority}`] 
        }
      }
      return incident
    }))
    showNotification(`Priority manually overridden to ${newPriority}.`, 'info')
  }

  // Override / Assign alternate team
  const overrideTeam = (id, newTeam) => {
    setIncidents(current => current.map(incident => 
      incident.id === id 
        ? { ...incident, team: newTeam } 
        : incident
    ))
    showNotification(`Assigned alternate team: ${newTeam}`, 'info')
  }

  // Handle Citizen Form Submit
  const handleCitizenSubmit = (e) => {
    e.preventDefault()
    if (!citizenForm.description.trim()) {
      showNotification('Please enter a description of the emergency.', 'warning')
      return
    }

    const payload = { ...citizenForm }

    if (offlineMode) {
      setOfflineQueue(prev => [...prev, payload])
      showNotification('Device offline. Report stored in local backup queue.', 'warning')
      setCitizenForm(prev => ({ ...prev, description: '', name: '', phone: '' }))
      return
    }

    // Process using explainable AI Engine
    const result = processCitizenReport(payload, incidents, weatherAlert)
    
    // Log simulation steps
    const steps = [
      `[Triage Engine] Received report: "${payload.description}" at ${payload.location}`,
      `[AI Audit] Base hazard priority evaluated for "${payload.type}"`,
      result.isDuplicate 
        ? `[Duplicate Detected] Match confidence: ${result.confidence}% with ${result.matchedId}. Merging reports...`
        : `[New Incident Registered] Assigned ID ${result.newIncident.id}. Priority: ${result.newIncident.priority} (Score: ${result.newIncident.score})`
    ]
    setSimulationLog(steps)

    if (result.isDuplicate) {
      setIncidents(prev => prev.map(inc => 
        inc.id === result.matchedId ? result.updatedIncident : inc
      ))
      showNotification(`Duplicate merged into ${result.matchedId}. Priority updated!`, 'info')
      setSelectedId(result.matchedId)
    } else {
      setIncidents(prev => [...prev, result.newIncident])
      showNotification(`New Triage Incident Created: ${result.newIncident.id}`, 'success')
      setSelectedId(result.newIncident.id)
    }

    // Reset fields
    setCitizenForm(prev => ({ ...prev, description: '', name: '', phone: '' }))
  }

  // AI Chat Explainer triggers
  const openExplainer = () => {
    const explanation = getAIExplanation(selected)
    setAiChatMessages([
      { sender: 'AI', text: `Hi Ravi. I can explain why ${selected.id} is prioritized as "${selected.priority}" (Score: ${selected.score}).` },
      { sender: 'AI', text: `Base Hazard Level: ${explanation.baseHazardRating}` },
      ...explanation.rulesTriggered.map(rule => ({ sender: 'AI', text: rule })),
      { sender: 'AI', text: `Suggested dispatch option: ${selected.team} with ETA of ${selected.eta}. Would you like to override any parameter?` }
    ])
    setAiExplainOpen(true)
  }

  const handleAIAsk = (question) => {
    setAiChatMessages(prev => [...prev, { sender: 'Operator', text: question }])
    
    setTimeout(() => {
      let response = ""
      if (question.includes("route")) {
        response = `The route "${selected.route}" was calculated avoiding local waterlogging indexes on Ameerpet Metro service lanes, maintaining safety for the vehicle response.`
      } else if (question.includes("team")) {
        response = `${selected.team} matches the specialized equipment needed for "${selected.type}". Altering the team might affect dispatch efficiency.`
      } else {
        response = `This triage uses dynamic multipliers including local sensor levels, live reports, and weather overrides. Operators can override any recommendation using the select panels.`
      }
      setAiChatMessages(prev => [...prev, { sender: 'AI', text: response }])
    }, 600)
  }

  // Filtered incidents for Map View
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchPriority = mapPriorityFilter === 'All' || inc.priority === mapPriorityFilter
      const matchStatus = mapStatusFilter === 'All' || inc.status === mapStatusFilter
      return matchPriority && matchStatus
    })
  }, [incidents, mapPriorityFilter, mapStatusFilter])

  return (
    <main className="app-shell">
      {/* Toast Alert Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          <span>{notification.type === 'success' ? '✓' : notification.type === 'warning' ? '⚠' : 'ℹ'}</span>
          {notification.message}
        </div>
      )}

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">↟</span>
          <span>Flood<span>Response</span></span>
        </div>
        <p className="pilot-tag">AI CONTROL ROOM</p>
        <nav aria-label="Main navigation">
          {['Control room', 'Incident map', 'Response teams', 'Reports'].map((item) => (
            <button key={item} className={view === item ? 'nav-item active' : 'nav-item'} onClick={() => setView(item)}>
              <span>{item === 'Control room' ? '⌘' : item === 'Incident map' ? '⌖' : item === 'Response teams' ? '◉' : '▤'}</span>
              {item}
              {item === 'Reports' && offlineQueue.length > 0 && <span className="badge amber">{offlineQueue.length}</span>}
              {item === 'Control room' && activeCount > 0 && <span className="badge red">{activeCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="pulse-dot"></span>
          <div>
            <strong>Monsoon watch active</strong>
            <small>Ameerpet pilot zone</small>
          </div>
        </div>

        <div className="operator">
          <div className="avatar">RS</div>
          <div>
            <strong>Ravi Sharma</strong>
            <small>Control room officer</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">HYDERABAD · AMEERPET PILOT</p>
            <h1>Good evening, Ravi.</h1>
            <p className="subhead">Here is what needs attention right now.</p>
          </div>

          <div className="top-actions">
            {/* Offline Mode Toggle Sim */}
            <button 
              className={`offline-toggle-btn ${offlineMode ? 'offline' : 'online'}`}
              onClick={() => setOfflineMode(!offlineMode)}
              title={offlineMode ? 'Simulating offline state' : 'Network is online'}
            >
              {offlineMode ? '🔴 Offline Mode' : '🟢 Online Mode'}
            </button>

            {/* Weather Alert Selector */}
            <div className="weather-dropdown-container">
              <label htmlFor="weather-alert-select">Alert: </label>
              <select 
                id="weather-alert-select"
                value={weatherAlert} 
                onChange={(e) => {
                  setWeatherAlert(e.target.value)
                  showNotification(`Weather alert level shifted to ${e.target.value}`, 'warning')
                }}
                className={`weather-alert-select ${weatherAlert.toLowerCase()}`}
              >
                <option value="Green">Normal (Green)</option>
                <option value="Yellow">Warning (Yellow)</option>
                <option value="Red">Emergency (Red)</option>
              </select>
            </div>

            <span className="live-badge"><i></i>Live monitoring</span>
          </div>
        </header>

        {/* Global Dashboard alert banners */}
        {weatherAlert === 'Red' && (
          <div className="alert-banner red-alert pulsing">
            <strong>⚠️ CRITICAL WEATHER WARNING (RED ALERT):</strong> Base AI emergency scores boosted by +15. Ensure all high-risk hazards are evaluated immediately.
          </div>
        )}

        {/* MAIN VIEWS CONDITIONAL ROUTING */}

        {view === 'Control room' && (
          <>
            <section className="metrics" aria-label="Live incident summary">
              <div className="metric">
                <div className="metric-icon red">!</div>
                <div>
                  <span>Needs action</span>
                  <strong>{activeCount}</strong>
                  <small>AI-ranked incidents</small>
                </div>
              </div>
              <div className="metric">
                <div className="metric-icon amber">⌁</div>
                <div>
                  <span>In verification</span>
                  <strong>{incidents.filter((i) => i.status === 'Needs verification').length}</strong>
                  <small>Low-confidence reports</small>
                </div>
              </div>
              <div className="metric">
                <div className="metric-icon blue">✓</div>
                <div>
                  <span>Response dispatched</span>
                  <strong>{approvedCount || '—'}</strong>
                  <small>{approvedCount ? 'Officer-approved' : 'No teams dispatched yet'}</small>
                </div>
              </div>
            </section>

            <section className="content-grid">
              <div className="incident-panel panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">AI PRIORITY QUEUE</p>
                    <h2>Incidents needing a decision</h2>
                  </div>
                  <button className="text-button" onClick={openExplainer}>Explain ranking</button>
                </div>
                <p className="panel-intro">Each ranking is explainable. AI recommends; the control-room officer decides.</p>
                
                <div className="incident-list">
                  {sortedIncidents.filter(inc => inc.status !== 'Resolved').map((incident) => (
                    <button 
                      className={selected.id === incident.id ? 'incident-row selected' : 'incident-row'} 
                      key={incident.id} 
                      onClick={() => {
                        setSelectedId(incident.id)
                        setAiExplainOpen(false)
                      }}
                    >
                      <div className="incident-icon">{incident.icon}</div>
                      <div className="incident-copy">
                        <div>
                          <strong>{incident.type}</strong>
                          <span className={`status ${incident.priority.toLowerCase().replace(' ', '-')}`}>{incident.priority}</span>
                          {incident.status === 'Team dispatched' && <span className="status-badge blue-text">Dispatched</span>}
                        </div>
                        <p>{incident.location} · {incident.time}</p>
                        <small>{incident.reports} linked report{incident.reports > 1 ? 's' : ''} · {incident.status}</small>
                      </div>
                      <div className="score">
                        <strong>{incident.score}</strong>
                        <small>/100</small>
                      </div>
                    </button>
                  ))}
                  {sortedIncidents.filter(inc => inc.status !== 'Resolved').length === 0 && (
                    <p className="empty-state">No pending triage decisions. All clear!</p>
                  )}
                </div>
              </div>

              <div className="map-panel panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">LIVE INCIDENT MAP</p>
                    <h2>Ameerpet pilot zone</h2>
                  </div>
                  <button className="map-button" onClick={() => setView('Incident map')}>Fullscreen map</button>
                </div>
                
                <div className="map-canvas" role="img" aria-label="Illustrative map of the Ameerpet pilot zone showing reported incidents">
                  <div className="river one"></div>
                  <div className="river two"></div>
                  <div className="road r1"></div>
                  <div className="road r2"></div>
                  <div className="road r3"></div>
                  
                  <span className="map-label l1">Ameerpet Metro</span>
                  <span className="map-label l2">Buddhanagar</span>
                  <span className="map-label l3">Maitrivanam</span>
                  
                  {/* Incident Pins */}
                  {incidents.filter(inc => inc.status !== 'Resolved').map((incident) => (
                    <button 
                      key={incident.id} 
                      onClick={() => setSelectedId(incident.id)} 
                      className={`map-pin ${incident.priority.toLowerCase()} ${incident.status === 'Team dispatched' ? 'pulse-pin' : ''}`} 
                      style={{ left: `${incident.x}%`, top: `${incident.y}%` }} 
                      title={incident.type}
                    >
                      {incident.icon}
                    </button>
                  ))}

                  {/* Active Vehicle/Response animation */}
                  {Object.keys(dispatchAnimations).map(id => {
                    const anim = dispatchAnimations[id]
                    if (anim.progress >= 100) return null
                    return (
                      <div 
                        key={`vehicle-${id}`} 
                        className="map-vehicle" 
                        style={{ left: `${anim.x}%`, top: `${anim.y}%` }}
                        title={`${anim.teamName} en route`}
                      >
                        🚨
                      </div>
                    )
                  })}

                  <div className="map-legend">
                    <span><i className="legend-dot critical"></i>Critical</span>
                    <span><i className="legend-dot high"></i>High</span>
                    <span><i className="legend-dot medium"></i>Medium</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Recommendation Panel */}
            <section className="recommendation panel">
              {/* Resource overlap error warning */}
              {activeConflict && (
                <div className="alert-banner warning-alert">
                  <strong>⚠️ RESOURCE CONFLICT:</strong> <b>{selected.team}</b> is already dispatched to <b>{activeConflict.id}</b> ({activeConflict.type}). Recommend assigning an alternate team below before approving.
                </div>
              )}

              <div className="recommendation-top">
                <div>
                  <p className="eyebrow">AI RESPONSE RECOMMENDATION · {selected.id}</p>
                  <h2>
                    {selected.icon} {selected.type}
                    <span className={`status ${selected.priority.toLowerCase()}`}>{selected.priority} priority</span>
                  </h2>
                  <p>{selected.location}</p>
                </div>
                
                <div className="confidence">
                  <span>AI confidence</span>
                  <strong>{selected.status === 'Team dispatched' ? '100%' : '92%'}</strong>
                </div>
              </div>

              <div className="recommendation-body">
                <div className="recommendation-copy">
                  <p className="reason">{selected.reason}</p>
                  
                  <div className="factor-list">
                    {selected.factors.map((factor) => (
                      <span key={factor}>✓ {factor}</span>
                    ))}
                  </div>

                  {/* Operator Override priority controls */}
                  <div className="override-controls">
                    <div>
                      <label htmlFor={`override-priority-${selected.id}`} className="mini-label">Adjust Triage Override:</label>
                      <select 
                        id={`override-priority-${selected.id}`}
                        value={selected.priority}
                        onChange={(e) => overridePriority(selected.id, e.target.value)}
                        className="override-select"
                        disabled={selected.status === 'Team dispatched'}
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`override-team-${selected.id}`} className="mini-label">Reassign Responder:</label>
                      <select 
                        id={`override-team-${selected.id}`}
                        value={selected.team}
                        onChange={(e) => overrideTeam(selected.id, e.target.value)}
                        className="override-select"
                        disabled={selected.status === 'Team dispatched'}
                      >
                        {teams.map(t => (
                          <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="team-card">
                  <span className="team-label">RECOMMENDED RESPONSE</span>
                  <strong>{selected.team}</strong>
                  <p>Safest available route: <b>{selected.route}</b></p>
                  
                  <div className="eta">
                    <span>Estimated arrival</span>
                    <strong>{selected.eta}</strong>
                  </div>
                </div>

                <div className="dispatch-action-block">
                  <button 
                    className="approve-button" 
                    disabled={selected.status === 'Team dispatched'} 
                    onClick={approveResponse}
                  >
                    {selected.status === 'Team dispatched' ? '✓ Team dispatched' : 'Approve response'}
                  </button>

                  {selected.status === 'Team dispatched' && (
                    <button 
                      className="resolve-button btn-secondary" 
                      onClick={() => resolveIncident(selected.id)}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* Explain with AI chat drawer */}
              {aiExplainOpen && (
                <div className="ai-chat-drawer">
                  <div className="drawer-header">
                    <h4>💬 AI Decision Assistant</h4>
                    <button className="close-btn" onClick={() => setAiExplainOpen(false)}>×</button>
                  </div>
                  <div className="chat-messages">
                    {aiChatMessages.map((m, idx) => (
                      <div key={idx} className={`chat-bubble ${m.sender.toLowerCase()}`}>
                        <strong>{m.sender}:</strong> {m.text}
                      </div>
                    ))}
                  </div>
                  <div className="drawer-suggested-questions">
                    <button onClick={() => handleAIAsk("Why was this route selected?")}>Why was this route selected?</button>
                    <button onClick={() => handleAIAsk("Why recommends this specific response team?")}>Why recommends this team?</button>
                    <button onClick={() => handleAIAsk("Show raw telemetry details.")}>Show raw telemetry data</button>
                  </div>
                </div>
              )}

              {/* Incident report audit logs */}
              {selected.linkedReports && selected.linkedReports.length > 0 && (
                <div className="audit-trail-section">
                  <h5>📝 Linked Citizen Reports Audit Trail ({selected.linkedReports.length})</h5>
                  <div className="reports-audit-grid">
                    {selected.linkedReports.map(rep => (
                      <div key={rep.id} className="audit-report-card">
                        <div><strong>{rep.name}</strong> <small>({rep.phone}) · {rep.timestamp}</small></div>
                        <p>"{rep.description}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="human-note">Human-in-the-loop: approving this recommendation is required before any response is dispatched.</p>
            </section>
          </>
        )}

        {/* FULL SCREEN INCIDENT MAP VIEW */}
        {view === 'Incident map' && (
          <section className="fullscreen-map-view panel">
            <div className="map-view-header">
              <h2>🗺️ Interactive Triage Map</h2>
              <div className="map-filters">
                <div className="filter-group">
                  <label htmlFor="map-priority-select">Priority: </label>
                  <select 
                    id="map-priority-select"
                    value={mapPriorityFilter} 
                    onChange={e => setMapPriorityFilter(e.target.value)}
                  >
                    <option value="All">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="map-status-select">Status: </label>
                  <select 
                    id="map-status-select"
                    value={mapStatusFilter} 
                    onChange={e => setMapStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Awaiting approval">Awaiting approval</option>
                    <option value="Needs verification">Needs verification</option>
                    <option value="Team dispatched">Dispatched</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="large-map-container">
              <div className="map-canvas large" role="img" aria-label="Large map view of Ameerpet pilot zone">
                <div className="river one"></div>
                <div className="river two"></div>
                <div className="road r1"></div>
                <div className="road r2"></div>
                <div className="road r3"></div>
                
                <span className="map-label l1">Ameerpet Metro</span>
                <span className="map-label l2">Buddhanagar</span>
                <span className="map-label l3">Maitrivanam</span>
                
                {filteredIncidents.map((incident) => (
                  <button 
                    key={incident.id} 
                    onClick={() => {
                      setSelectedId(incident.id)
                      setView('Control room')
                    }} 
                    className={`map-pin large ${incident.priority.toLowerCase()} ${incident.status === 'Team dispatched' ? 'pulse-pin' : ''}`} 
                    style={{ left: `${incident.x}%`, top: `${incident.y}%` }} 
                    title={`${incident.id}: ${incident.type} (${incident.priority})`}
                  >
                    <span className="pin-symbol">{incident.icon}</span>
                    <span className="pin-tooltip">{incident.id}: {incident.type} ({incident.priority})</span>
                  </button>
                ))}

                {/* Animated Dispatch Vehicles */}
                {Object.keys(dispatchAnimations).map(id => {
                  const anim = dispatchAnimations[id]
                  if (anim.progress >= 100) return null
                  return (
                    <div 
                      key={`large-vehicle-${id}`} 
                      className="map-vehicle large" 
                      style={{ left: `${anim.x}%`, top: `${anim.y}%` }}
                    >
                      🚨
                      <span className="pin-tooltip">{anim.teamName} En Route</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* RESPONSE TEAMS VIEWS */}
        {view === 'Response teams' && (
          <section className="teams-view panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">RESOURCES & LOGISTICS</p>
                <h2>Emergency Response Units</h2>
              </div>
            </div>
            
            <div className="teams-grid">
              {teams.map(team => {
                // Find current assigned active incident
                const activeAssignment = incidents.find(
                  i => i.team === team.name && i.status === 'Team dispatched'
                )

                return (
                  <div key={team.name} className={`team-card-detailed ${team.status.toLowerCase()}`}>
                    <div className="team-header-row">
                      <div className="team-icon-circle">{team.icon}</div>
                      <div>
                        <h3>{team.name}</h3>
                        <span className={`status-badge ${team.status.toLowerCase()}`}>
                          {team.status === 'Dispatched' ? '🚨 Dispatched' : '🟢 Idle (Available)'}
                        </span>
                      </div>
                    </div>

                    <div className="team-stats">
                      <div><strong>Skill Specialty:</strong> {team.skill}</div>
                      <div><strong>Base Response Speed:</strong> {team.baseEta} mins</div>
                      {activeAssignment && (
                        <div className="assignment-alert">
                          <strong>Active Callout:</strong> 
                          <button className="link-style-btn" onClick={() => {
                            setSelectedId(activeAssignment.id);
                            setView('Control room');
                          }}>
                            {activeAssignment.id} ({activeAssignment.type})
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="team-log-section">
                      <h4>Activity Log</h4>
                      <ul>
                        {team.logs.map((log, idx) => (
                          <li key={idx}>{log}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* CITIZEN REPORTS VIEW (EDUCATIONAL SIMULATOR) */}
        {view === 'Reports' && (
          <section className="citizen-portal panel">
            <div className="content-grid">
              <div className="citizen-form-section">
                <p className="eyebrow">CITIZEN ENGAGEMENT PORTAL</p>
                <h2>Submit Flood & Emergency Report</h2>
                <p className="panel-intro">Citizens can report flood hazards in real-time. The AI triage engine handles duplicate mapping and prioritizes emergencies automatically.</p>

                <form onSubmit={handleCitizenSubmit} className="citizen-form">
                  <div className="form-group">
                    <label htmlFor="rep-name">Reporter Name:</label>
                    <input 
                      id="rep-name"
                      type="text" 
                      placeholder="e.g. Anand Sharma" 
                      value={citizenForm.name} 
                      onChange={e => setCitizenForm(prev => ({ ...prev, name: e.target.value }))}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="rep-phone">Phone Number:</label>
                    <input 
                      id="rep-phone"
                      type="tel" 
                      placeholder="e.g. +91 98480 12345" 
                      value={citizenForm.phone} 
                      onChange={e => setCitizenForm(prev => ({ ...prev, phone: e.target.value }))}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="rep-location">Area Landmark:</label>
                    <select 
                      id="rep-location"
                      value={citizenForm.location} 
                      onChange={e => setCitizenForm(prev => ({ ...prev, location: e.target.value }))}
                    >
                      {Object.keys(LANDMARKS).map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="rep-type">Hazard Type:</label>
                    <select 
                      id="rep-type"
                      value={citizenForm.type} 
                      onChange={e => setCitizenForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="waterlogging">Waterlogged Street (Low)</option>
                      <option value="drainage">Blocked Drainage Cover (Medium)</option>
                      <option value="stranded">Stranded Residents (High)</option>
                      <option value="electrical">Live Sparking / Electrical Wire (Critical)</option>
                    </select>
                  </div>

                  <div className="form-checkbox-row">
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={citizenForm.vulnerable} 
                        onChange={e => setCitizenForm(prev => ({ ...prev, vulnerable: e.target.checked }))} 
                      />
                      Vulnerable citizens (elderly / infants) trapped
                    </label>

                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={citizenForm.urgent} 
                        onChange={e => setCitizenForm(prev => ({ ...prev, urgent: e.target.checked }))} 
                      />
                      High priority immediate response needed
                    </label>
                  </div>

                  <div className="form-group">
                    <label htmlFor="rep-desc">Description of Hazard:</label>
                    <textarea 
                      id="rep-desc"
                      rows="3" 
                      placeholder="What is happening? Provide specific details (e.g. water height, spark frequency)..." 
                      value={citizenForm.description} 
                      onChange={e => setCitizenForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-report-btn">
                    {offlineMode ? '💾 Store Offline Backup' : '🚀 Ingest and Analyze Report'}
                  </button>
                </form>
              </div>

              {/* Real-time Triage Logic Parser Log */}
              <div className="simulator-log-section">
                <p className="eyebrow">REAL-TIME TELEMETRY STREAM</p>
                <h2>Explainable AI Parser Output</h2>
                
                <div className="telemetry-box">
                  {simulationLog.length === 0 ? (
                    <p className="log-empty-state">Awaiting report ingest to parse telemetry...</p>
                  ) : (
                    <ul>
                      {simulationLog.map((log, idx) => (
                        <li key={idx} className="telemetry-log-item">{log}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="accuracy-audit-box">
                  <h4>💡 System Data Accuracy Rules:</h4>
                  <ul>
                    <li>Auto-duplication searches active lists in <strong>{weatherAlert} Alert mode</strong>.</li>
                    <li>Merges identical area reports with overlapping keywords to prevent report spam.</li>
                    <li>Retains nested audits (Reporter Name & Phone) to preserve dispatch transparency.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
