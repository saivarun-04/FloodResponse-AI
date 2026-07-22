import { useMemo, useState, useEffect, useRef } from 'react'
import { processCitizenReport, getAIExplanation, simulateLLMParse, LANDMARKS } from './triageEngine'

const initialIncidents = [
  {
    id: 'INC-1048',
    type: 'Live electrical wire',
    icon: '⚡',
    location: 'Bandlaguda Main Road, Hyderabad',
    time: '10 min ago',
    priority: 'Critical',
    score: 98,
    reports: 6,
    route: 'Bandlaguda Main Rd',
    eta: '14 min',
    team: 'Electrical Emergency Team 02',
    reason: 'Live snapped high-voltage power wire on a heavily waterlogged road. 6 matching reports registered.',
    factors: ['Threat to life', '6 corroborating reports', 'Severe waterlogging'],
    status: 'Awaiting approval',
    lat: 17.3486,
    lng: 78.4612,
    linkedReports: [
      { id: 'REP-001', name: 'Zafar', phone: '9848011223', description: 'Snapped wire sparkling in water on Bandlaguda main road.', timestamp: '12 min ago' },
      { id: 'REP-002', name: 'Afroz', phone: '9000122334', description: 'People getting shocks stepping out of autos. Waterlogged.', timestamp: '10 min ago' },
      { id: 'REP-003', name: 'Imran Khan', phone: '9123450001', description: 'Live wire fell down. Road flooded.', timestamp: '9 min ago' },
      { id: 'REP-004', name: 'Sameer', phone: '9866012233', description: 'A snapped power line is active in the water log.', timestamp: '7 min ago' },
      { id: 'REP-005', name: 'Md. Ali', phone: '9502011224', description: 'Please shut down power grid in Bandlaguda. Sparks everywhere.', timestamp: '6 min ago' },
      { id: 'REP-006', name: 'Yasmin B.', phone: '9010044552', description: 'Wire sparking near the bus shelter. Road under water.', timestamp: '4 min ago' }
    ],
    smsHistory: [
      { sender: 'Citizen', text: 'Live snapping wire fell in flood water! We are trapped in auto.', time: '10 min ago' }
    ]
  },
  {
    id: 'INC-1047',
    type: 'Live electrical wire',
    icon: '⚡',
    location: 'Telecom Colony, Alwal',
    time: '15 min ago',
    priority: 'Critical',
    score: 95,
    reports: 4,
    route: 'Alwal NH-44 approach',
    eta: '18 min',
    team: 'Electrical Emergency Team 02',
    reason: 'Fallen tree branch snapped live power cable onto a parked vehicle. High danger of contact.',
    factors: ['Transformer line snapped', 'High-voltage risk', 'Emergency access blocked'],
    status: 'Awaiting approval',
    lat: 17.5011,
    lng: 78.5029,
    linkedReports: [
      { id: 'REP-007', name: 'Sandeep', phone: '9111222333', description: 'Tree branch fell on car and snapped the power cable. Sparkling.', timestamp: '15 min ago' },
      { id: 'REP-008', name: 'Preethika', phone: '9122333444', description: 'Live wire snapped and fell on tree branches above cars.', timestamp: '12 min ago' },
      { id: 'REP-009', name: 'Latha C.', phone: '9440122883', description: 'Branch fell down, snapped power lines are sparking.', timestamp: '8 min ago' },
      { id: 'REP-010', name: 'Srinivas', phone: '9000511223', description: 'Heavy sparkling in Telecom Colony due to fallen tree branch on wire.', timestamp: '6 min ago' }
    ],
    smsHistory: [
      { sender: 'Citizen', text: 'Wire is touching our car door. We cannot step out safely.', time: '15 min ago' }
    ]
  },
  {
    id: 'INC-1046',
    type: 'Stranded residents',
    icon: '🛟',
    location: 'SR Nagar Metro Corridor',
    time: '25 min ago',
    priority: 'High',
    score: 85,
    reports: 5,
    route: 'Srinivasa Nagar Road',
    eta: '9 min',
    team: 'Disaster Response Unit 01',
    reason: 'Deep cellar flooding in basement apartment complexes. 5 reports. Elderly residents unable to climb up.',
    factors: ['Vulnerable residents', '5 corroborating reports', 'Basement inundation'],
    status: 'Awaiting approval',
    lat: 17.4445,
    lng: 78.4410,
    linkedReports: [
      { id: 'REP-011', name: 'Rajesh V.', phone: '9123456789', description: 'Basement fully flooded under metro line. Residents stuck.', timestamp: '25 min ago' },
      { id: 'REP-012', name: 'Kumar', phone: '9848033445', description: 'Water level entering ground floor. 3 feet deep.', timestamp: '20 min ago' },
      { id: 'REP-013', name: 'Divya', phone: '9502044883', description: 'Elderly grandparents trapped in cellar house.', timestamp: '17 min ago' },
      { id: 'REP-014', name: 'Venkat', phone: '9988552211', description: 'Stranded on SR Nagar street cellar. Water level rising.', timestamp: '12 min ago' },
      { id: 'REP-015', name: 'Laxmi', phone: '9441223344', description: 'Basement flooded, no exit route.', timestamp: '10 min ago' }
    ],
    smsHistory: []
  },
  {
    id: 'INC-1045',
    type: 'Blocked drainage',
    icon: '🕳️',
    location: 'Maitrivanam Nala stretch',
    time: '35 min ago',
    priority: 'Medium',
    score: 62,
    reports: 3,
    route: 'Balkampet Road',
    eta: '15 min',
    team: 'Drainage Response Team 04',
    reason: 'Severe garbage and plastic blockage in stormwater nala causing overflow near Krishna Kanth Park road.',
    factors: ['Nala encroachment', '3 corroborating reports', 'Risk to nearby structures'],
    status: 'Awaiting approval',
    lat: 17.4385,
    lng: 78.4440,
    linkedReports: [
      { id: 'REP-016', name: 'Vivek S.', phone: '9440122334', description: 'Garbage choking stormwater nala behind Maitrivanam.', timestamp: '35 min ago' },
      { id: 'REP-017', name: 'Kiran P.', phone: '9849011223', description: 'Stormwater nala overflowing on main road.', timestamp: '30 min ago' },
      { id: 'REP-018', name: 'Ramesh K.', phone: '9900112233', description: 'Drainage nala blocked near Krishna Kanth Park.', timestamp: '24 min ago' }
    ],
    smsHistory: []
  },
  {
    id: 'INC-1049',
    type: 'Waterlogged road',
    icon: '🌊',
    location: 'Ameerpet Metro Parking',
    time: '45 min ago',
    priority: 'Low',
    score: 40,
    reports: 2,
    route: 'Metro service lane',
    eta: '20 min',
    team: 'Traffic Diversion Team 03',
    reason: 'Heavy runoff from metro rail structure flooding parking entrance, stalling two-wheelers.',
    factors: ['Metro runoff', 'Traffic congestion', 'Needs verification'],
    status: 'Needs verification',
    lat: 17.4357,
    lng: 78.4446,
    linkedReports: [
      { id: 'REP-019', name: 'David L.', phone: '9222333444', description: 'Water level rising quickly in metro approach lanes.', timestamp: '45 min ago' },
      { id: 'REP-020', name: 'Suresh', phone: '9885011223', description: 'Metro station parking cellar flooded, bikes submerged.', timestamp: '38 min ago' }
    ],
    smsHistory: []
  },
  {
    id: 'INC-1050',
    type: 'Blocked drainage',
    icon: '🕳️',
    location: 'Balkampet Lane 4',
    time: '1 hr ago',
    priority: 'Medium',
    score: 52,
    reports: 2,
    route: 'Balkampet Main Road',
    eta: '18 min',
    team: 'Drainage Response Team 04',
    reason: 'Clogged sewer inlet causing backflow onto residential street.',
    factors: ['Residential street flood', '2 reports'],
    status: 'Awaiting approval',
    lat: 17.4425,
    lng: 78.4485,
    linkedReports: [
      { id: 'REP-021', name: 'Pramod', phone: '9333444555', description: 'Drainage water entering lane 4.', timestamp: '1 hr ago' },
      { id: 'REP-022', name: 'Hari', phone: '9123412345', description: 'Blocked sewage backflow on lane 4.', timestamp: '52 min ago' }
    ],
    smsHistory: []
  },
  {
    id: 'INC-1051',
    type: 'Waterlogged road',
    icon: '🌊',
    location: 'Buddhanagar, Lane 3',
    time: '1.2 hrs ago',
    priority: 'Low',
    score: 36,
    reports: 1,
    route: 'Srinivasa Nagar Road',
    eta: '22 min',
    team: 'Traffic Diversion Team 03',
    reason: 'Standing water up to 6 inches, vehicles moving slowly.',
    factors: ['Single report', 'Minor waterlogging'],
    status: 'Needs verification',
    lat: 17.4325,
    lng: 78.4465,
    linkedReports: [
      { id: 'REP-023', name: 'Gopal K.', phone: '9444555666', description: 'Water build up on lane 3.', timestamp: '1.2 hrs ago' }
    ],
    smsHistory: []
  },
  {
    id: 'INC-1052',
    type: 'Stranded residents',
    icon: '🛟',
    location: 'Satyam Theatre Road',
    time: '2 hrs ago',
    priority: 'High',
    score: 72,
    reports: 3,
    route: 'Srinivasa Nagar Road',
    eta: '12 min',
    team: 'Disaster Response Unit 01',
    reason: 'Ground floor shopping complex flooded, shopkeepers unable to exit.',
    factors: ['Commercial zone flood', '3 reports'],
    status: 'Awaiting approval',
    lat: 17.4385,
    lng: 78.4440,
    linkedReports: [
      { id: 'REP-024', name: 'Naresh', phone: '9555666777', description: 'Cellar shops completely flooded.', timestamp: '2 hrs ago' },
      { id: 'REP-025', name: 'Santosh', phone: '9848012356', description: 'Ground floor shops under water near Satyam theatre.', timestamp: '1.8 hrs ago' },
      { id: 'REP-026', name: 'Raju', phone: '9000123999', description: 'Severe logging, shopkeepers stranded.', timestamp: '1.5 hrs ago' }
    ],
    smsHistory: []
  }
]

const initialTeams = [
  { name: 'Electrical Emergency Team 02', icon: '⚡', skill: 'Power Grid Isolation', status: 'Idle', baseEta: 12, logs: ['System standby'] },
  { name: 'Disaster Response Unit 01', icon: '🛟', skill: 'Search, Rescue & Boats', status: 'Idle', baseEta: 9, logs: ['Ready for dispatch'] },
  { name: 'Drainage Response Team 04', icon: '🕳️', skill: 'High-Volume Pumps', status: 'Idle', baseEta: 18, logs: ['Maintenance complete'] },
  { name: 'Traffic Diversion Team 03', icon: '🌊', skill: 'Signage & Detours', status: 'Idle', baseEta: 22, logs: ['Patrolling sector'] }
]

const initialSensors = [
  { id: 'SEN-102', landmark: 'Maitrivanam junction, Ameerpet', type: 'Drainage Level Sensor', value: 88, status: 'CRITICAL', unit: '%' },
  { id: 'SEN-105', landmark: 'Buddhanagar, Lane 3', type: 'Water Flow Valve', value: 78, status: 'WARNING', unit: 'm³/s' },
  { id: 'SEN-108', landmark: 'Balkampet Main Road', type: 'Road Flood Depth', value: 12, status: 'NORMAL', unit: 'cm' }
]

// HELPER FUNCTIONS FOR GIS STREET NETWORK ROUTING
const getRouteCoordinates = (inc) => {
  const depot = [17.4357, 78.4446] // Ameerpet Metro Depot
  const target = [inc.lat !== undefined ? inc.lat : 17.4374, inc.lng !== undefined ? inc.lng : 78.4482]
  
  if (inc.location && inc.location.includes("Bandlaguda")) {
    // Ameerpet -> Khairatabad Junction -> Lakdikapul -> Charminar -> Bandlaguda
    return [depot, [17.4138, 78.4560], [17.4045, 78.4608], [17.3616, 78.4747], target]
  }
  if (inc.location && inc.location.includes("Alwal")) {
    // Ameerpet -> Begumpet -> Paradise Junction -> Secunderabad -> Alwal
    return [depot, [17.4375, 78.4735], [17.4436, 78.4842], [17.4344, 78.5015], target]
  }
  if (inc.location && inc.location.includes("SR Nagar")) {
    // Ameerpet Metro -> SR Nagar Metro Corridor
    return [depot, [17.4420, 78.4425], target]
  }
  if (inc.location && inc.location.includes("Satyam")) {
    // Ameerpet Metro -> Satyam Theatre Road
    return [depot, [17.4372, 78.4442], target]
  }
  return [depot, target]
}

const interpolatePath = (path, progress) => {
  if (!path || path.length === 0) return [17.4357, 78.4446]
  if (path.length === 1) return path[0]
  if (progress <= 0) return path[0]
  if (progress >= 100) return path[path.length - 1]

  const numSegments = path.length - 1
  const segmentDuration = 100 / numSegments
  
  const segmentIndex = Math.min(numSegments - 1, Math.floor(progress / segmentDuration))
  const segmentProgress = (progress % segmentDuration) / segmentDuration
  
  const pStart = path[segmentIndex]
  const pEnd = path[segmentIndex + 1]
  
  const lat = pStart[0] + (pEnd[0] - pStart[0]) * segmentProgress
  const lng = pStart[1] + (pEnd[1] - pStart[1]) * segmentProgress
  
  return [lat, lng]
}

// LEAFLET MAP WRAPPER COMPONENT
function MapContainer({ incidents, selectedId, setSelectedId, dispatchAnimations, mapPriorityFilter, mapStatusFilter, isMini = false }) {
  const mapRef = useRef(null)
  const leafletMapInstance = useRef(null)
  const markersLayerRef = useRef(null)
  const polylineLayerRef = useRef(null)
  const vehicleMarkersRef = useRef({})
  const [leafletReady, setLeafletReady] = useState(typeof window.L !== 'undefined')

  // Check if Leaflet script loaded
  useEffect(() => {
    if (leafletReady) return
    const interval = setInterval(() => {
      if (typeof window.L !== 'undefined') {
        setLeafletReady(true)
        clearInterval(interval)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [leafletReady])

  // Filter display markers
  const displayIncidents = useMemo(() => {
    return incidents.filter(inc => {
      if (isMini && inc.status === 'Resolved') return false
      const matchPriority = mapPriorityFilter === 'All' || inc.priority === mapPriorityFilter
      const matchStatus = mapStatusFilter === 'All' || inc.status === mapStatusFilter
      return matchPriority && matchStatus
    })
  }, [incidents, mapPriorityFilter, mapStatusFilter, isMini])

  // Initialize Map
  useEffect(() => {
    if (!leafletReady || !mapRef.current) return

    const L = window.L
    
    // Safety check to prevent double init
    if (leafletMapInstance.current) return

    try {
      leafletMapInstance.current = L.map(mapRef.current, {
        center: [17.425, 78.465], // Hyderabad Central
        zoom: 11,
        zoomControl: !isMini,
        dragging: !isMini,
        scrollWheelZoom: !isMini,
        touchZoom: !isMini
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(leafletMapInstance.current)

      markersLayerRef.current = L.layerGroup().addTo(leafletMapInstance.current)
      polylineLayerRef.current = L.layerGroup().addTo(leafletMapInstance.current)
    } catch (err) {
      console.error("Leaflet initialization failed", err)
    }

    return () => {
      // Clean up instance on unmount
      if (leafletMapInstance.current) {
        try {
          leafletMapInstance.current.remove()
        } catch (e) {
          console.warn("Error removing leaflet instance", e)
        }
        leafletMapInstance.current = null
      }
    }
  }, [leafletReady, isMini])

  // Redraw Markers, Polylines and Vehicles
  useEffect(() => {
    if (!leafletMapInstance.current || typeof window.L === 'undefined') return

    const L = window.L
    const map = leafletMapInstance.current
    const markersLayer = markersLayerRef.current
    const polylineLayer = polylineLayerRef.current

    if (!markersLayer || !polylineLayer) return

    markersLayer.clearLayers()
    polylineLayer.clearLayers()

    // Clean up old vehicle markers
    Object.keys(vehicleMarkersRef.current).forEach(id => {
      if (vehicleMarkersRef.current[id]) {
        try {
          vehicleMarkersRef.current[id].remove()
        } catch {}
      }
    })
    vehicleMarkersRef.current = {}

    // Add Incident Pins
    displayIncidents.forEach(inc => {
      const lat = inc.lat !== undefined ? inc.lat : 17.4374
      const lng = inc.lng !== undefined ? inc.lng : 78.4482
      
      const color = inc.priority === 'Critical' ? '#e96455' : 
                    inc.priority === 'High' ? '#e9a256' : 
                    inc.priority === 'Medium' ? '#d5bc4d' : '#58a998'

      const customIcon = L.divIcon({
        className: `custom-leaflet-marker ${inc.id === selectedId ? 'selected-leaflet-marker' : ''}`,
        html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: grid; place-items: center; font-size: 15px; box-shadow: 0 2px 7px rgba(0,0,0,0.3); line-height: 1; text-align: center;">${inc.icon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(markersLayer)
        .on('click', () => {
          setSelectedId(inc.id)
        })

      if (inc.id === selectedId) {
        marker.bindPopup(`<b>${inc.id}: ${inc.type}</b><br/>${inc.location}<br/>Priority: ${inc.priority}`, { closeButton: false }).openPopup()
        if (!isMini) {
          map.setView([lat, lng], 15, { animate: true })
        }
      }
    })

    // Draw active routes & vehicles
    Object.keys(dispatchAnimations).forEach(id => {
      const anim = dispatchAnimations[id]
      if (anim.progress >= 100) return

      const inc = incidents.find(i => i.id === id)
      if (!inc || inc.lat === undefined) return

      // Retrieve multi-point street grid routing
      const pathCoordinates = getRouteCoordinates(inc)

      // Draw routing dashed line
      L.polyline(pathCoordinates, {
        color: '#176f59',
        weight: 3,
        opacity: 0.7,
        dashArray: '6, 6'
      }).addTo(polylineLayer)

      // Interpolate current location along the multi-point path
      const [currentLat, currentLng] = interpolatePath(pathCoordinates, anim.progress)

      const vehicleIcon = L.divIcon({
        className: 'leaflet-vehicle-icon',
        html: `<div style="font-size: 20px; text-shadow: 0 1px 4px rgba(0,0,0,0.3);">🚨</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })

      const vehicleMarker = L.marker([currentLat, currentLng], { icon: vehicleIcon }).addTo(map)
      vehicleMarkersRef.current[id] = vehicleMarker
    })

    // Fit Bounds if large view and pins present
    if (!isMini && displayIncidents.length > 0 && !selectedId) {
      const validPins = displayIncidents.filter(i => i.lat !== undefined && i.lng !== undefined)
      if (validPins.length > 0) {
        const bounds = L.latLngBounds(validPins.map(i => [i.lat, i.lng]))
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    }
  }, [displayIncidents, selectedId, dispatchAnimations, isMini, setSelectedId, incidents])

  if (!leafletReady) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', minHeight: isMini ? '293px' : '500px', background: '#1c2422', color: '#72ddad', fontFamily: 'DM Mono', fontSize: '11px', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '20px', display: 'block', marginBottom: '8px', animation: 'pulsing 2s infinite' }}>🛰️</span>
          Connecting to GIS Satellite Tiles...
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, borderRadius: '8px', zIndex: 1 }} 
    />
  )
}

function App() {
  // Auto-scroll refs
  const chatBottomRef = useRef(null)
  const smsBottomRef = useRef(null)



  // Authentication Role Gateways
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    return localStorage.getItem('nxtwave_role') || null
  })
  const [loginMode, setLoginMode] = useState(null)
  const [operatorUser, setOperatorUser] = useState('')
  const [operatorPass, setOperatorPass] = useState('')
  const [loginError, setLoginError] = useState('')
  const [operatorAuditChecked, setOperatorAuditChecked] = useState(false)
  const [lastSubmitTime, setLastSubmitTime] = useState(0)

  // State Management with LocalStorage persistence
  const [incidents, setIncidents] = useState(() => {
    const saved = localStorage.getItem('nxtwave_incidents_v5')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // If it's the old schema (missing lat/lng), ignore cached data
        if (parsed.length > 0 && parsed[0].lat === undefined) {
          localStorage.removeItem('nxtwave_incidents_v5')
          localStorage.removeItem('nxtwave_teams_v5') // Reset teams too
          return initialIncidents
        }
        return parsed
      } catch {
        return initialIncidents
      }
    }
    return initialIncidents
  })
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('nxtwave_teams_v5')
    if (!localStorage.getItem('nxtwave_incidents_v5')) {
      localStorage.removeItem('nxtwave_teams_v5')
      return initialTeams
    }
    return saved ? JSON.parse(saved) : initialTeams
  })
  const [weatherAlert, setWeatherAlert] = useState(() => {
    return localStorage.getItem('nxtwave_weather_v5') || 'Green'
  })
  const [offlineQueue, setOfflineQueue] = useState(() => {
    const saved = localStorage.getItem('nxtwave_offline_queue_v5')
    return saved ? JSON.parse(saved) : []
  })
  const [sensors] = useState(initialSensors)

  // Navigation & Details selected
  const [selectedId, setSelectedId] = useState('INC-1048')
  const [view, setView] = useState('Control room')
  const [offlineMode, setOfflineMode] = useState(false)
  const [notification, setNotification] = useState(null)

  // Developer Logger & Retractable Drawer state
  const [devConsoleOpen, setDevConsoleOpen] = useState(true)
  const [devLogs, setDevLogs] = useState([])

  // AI Assistant Explainer Chat Drawer state
  const [aiExplainOpen, setAiExplainOpen] = useState(false)
  const [aiChatMessages, setAiChatMessages] = useState([])

  // Preemption / Redirect state
  const [preemptTargetIncidentId, setPreemptTargetIncidentId] = useState('')
  const [preemptDialogOpen, setPreemptDialogOpen] = useState(false)

  // Live Dispatch Animation coordinates state
  const [dispatchAnimations, setDispatchAnimations] = useState({})

  // Form State (Citizen Report Submission)
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
  const [smsInputText, setSmsInputText] = useState('')

  // Filters for Map view
  const [mapPriorityFilter, setMapPriorityFilter] = useState('All')
  const [mapStatusFilter, setMapStatusFilter] = useState('All')

  // Save State to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('nxtwave_incidents_v5', JSON.stringify(incidents))
  }, [incidents])

  useEffect(() => {
    localStorage.setItem('nxtwave_teams_v5', JSON.stringify(teams))
  }, [teams])

  useEffect(() => {
    localStorage.setItem('nxtwave_weather_v5', weatherAlert)
  }, [weatherAlert])

  useEffect(() => {
    localStorage.setItem('nxtwave_offline_queue_v5', JSON.stringify(offlineQueue))
  }, [offlineQueue])

  useEffect(() => {
    if (currentUserRole) {
      localStorage.setItem('nxtwave_role', currentUserRole)
    } else {
      localStorage.removeItem('nxtwave_role')
    }
  }, [currentUserRole])

  const prevWeatherRef = useRef(weatherAlert)

  useEffect(() => {
    const prevWeather = prevWeatherRef.current
    if (prevWeather !== weatherAlert) {
      let prevBonus = 0
      if (prevWeather === 'Red') prevBonus = 15
      else if (prevWeather === 'Yellow') prevBonus = 5

      let newBonus = 0
      if (weatherAlert === 'Red') newBonus = 15
      else if (weatherAlert === 'Yellow') newBonus = 5

      const delta = newBonus - prevBonus

      if (delta !== 0) {
        setIncidents(prev => prev.map(inc => {
          if (inc.status === 'Resolved') return inc
          const newScore = Math.min(100, Math.max(10, inc.score + delta))
          let newPriority = inc.priority
          if (newScore >= 85) newPriority = "Critical"
          else if (newScore >= 65) newPriority = "High"
          else if (newScore >= 45) newPriority = "Medium"
          else newPriority = "Low"
          return { ...inc, score: newScore, priority: newPriority }
        }))
        logDev(`AI Weather Alert Urgency Shift: Adjusting active incident scores by ${delta >= 0 ? '+' : ''}${delta}.`, 'ai')
      }
      prevWeatherRef.current = weatherAlert
    }
  }, [weatherAlert])

  useEffect(() => {
    setOperatorAuditChecked(false)
  }, [selectedId])

  // Helper: Log Developer and Database Telemetry
  const logDev = (message, type = 'system') => {
    const timestamp = new Date().toLocaleTimeString()
    setDevLogs(prev => [`[${timestamp}] [${type.toUpperCase()}] ${message}`, ...prev])
  }

  // Trigger brief alert toast notifications
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
    logDev(`Toast Notification: "${message}" (${type})`, 'ui')
  }

  // Trigger Developer Telemetry logs initial
  useEffect(() => {
    logDev('Database connections initialized (SQLite3 Simulated).', 'db')
    logDev('Explainable AI scoring rules loaded.', 'ai')
    logDev('Offline queue monitor running in browser thread.', 'system')
  }, [])

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
            const nextProgress = Math.min(100, current.progress + 10)
            const x = 50 + ((current.targetX - 50) * nextProgress) / 100
            const y = 50 + ((current.targetY - 50) * nextProgress) / 100
            next[id] = { ...current, x, y, progress: nextProgress }
            updated = true
            
            if (nextProgress === 100) {
              setTeams(prevTeams => prevTeams.map(t => 
                t.name === current.teamName 
                  ? { ...t, logs: [`Arrived at ${id}`, ...t.logs] }
                  : t
              ))
              logDev(`Simulated vehicle coordinates matched incident ${id} (Arrived).`, 'system')
              logDev(`UPDATE response_units SET latitude=${current.targetX}, longitude=${current.targetY} WHERE name='${current.teamName}';`, 'db')
            }
          }
        }
        return updated ? next : prev
      })
    }, 400)

    return () => clearInterval(interval)
  }, [dispatchAnimations])

  // Process Offline Queue when back online
  useEffect(() => {
    if (!offlineMode && offlineQueue.length > 0) {
      showNotification(`Reconnected! Processing ${offlineQueue.length} queued offline report(s).`, 'success')
      logDev(`Processing offline queue synchronization... syncing ${offlineQueue.length} records.`, 'system')
      
      setIncidents(prevIncidents => {
        let currentIncidents = [...prevIncidents]
        offlineQueue.forEach(report => {
          logDev(`Executing LLM parser rules on offline record: "${report.description}"`, 'ai')
          
          const result = processCitizenReport(report, currentIncidents, weatherAlert)
          if (result.isDuplicate) {
            logDev(`Matched duplicate ID ${result.matchedId}. Merging report...`, 'ai')
            logDev(`UPDATE incidents SET reports = reports + 1, score = ${result.updatedIncident.score} WHERE id = '${result.matchedId}';`, 'db')
            currentIncidents = currentIncidents.map(inc => 
              inc.id === result.matchedId ? result.updatedIncident : inc
            )
          } else {
            logDev(`Ingesting new incident ${result.newIncident.id}.`, 'ai')
            logDev(`INSERT INTO incidents (id, type, location, priority, score) VALUES ('${result.newIncident.id}', '${result.newIncident.type}', '${result.newIncident.location}', '${result.newIncident.priority}', ${result.newIncident.score});`, 'db')
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

  useEffect(() => {
    if (chatBottomRef.current) {
      const container = chatBottomRef.current.parentElement
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [aiChatMessages])

  useEffect(() => {
    if (smsBottomRef.current) {
      const container = smsBottomRef.current.parentElement
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [selected?.smsHistory])

  const sortedIncidents = useMemo(
    () => [...incidents].sort((a, b) => b.score - a.score),
    [incidents],
  )

  // Resource Overlap Checker: checks if team is dispatched elsewhere
  const activeConflict = useMemo(() => {
    if (!selected || selected.status === 'Team dispatched') return null
    const duplicateAssignment = incidents.find(
      i => i.status === 'Team dispatched' && i.team === selected.team
    )
    return duplicateAssignment ? duplicateAssignment : null
  }, [selected, incidents])

  // Handle Operator Log-In
  const handleOperatorLogin = (e) => {
    e.preventDefault()
    if (operatorUser.toLowerCase() === 'operator' && operatorPass === 'password') {
      setCurrentUserRole('operator')
      setLoginError('')
      showNotification('Access authorized. Welcome Ravi Sharma.', 'success')
      logDev('Operator Ravi Sharma authenticated. Token generated.', 'security')
    } else {
      setLoginError('Invalid operator credentials. (Try: operator / password)')
      logDev('Failed operator authentication attempt.', 'security')
    }
  }

  // Handle Log-Out
  const handleLogout = () => {
    setCurrentUserRole(null)
    setLoginMode(null)
    setOperatorUser('')
    setOperatorPass('')
    setLoginError('')
    showNotification('Logged out successfully.', 'info')
    logDev('Session destroyed.', 'security')
  }

  // Dispatch approval
  const approveResponse = () => {
    if (!selected) return

    if (selected.score < 75 && selected.status === 'Awaiting approval' && !operatorAuditChecked) {
      showNotification('Low AI confidence. Operator audit verification required.', 'warning')
      return
    }

    setIncidents((current) => current.map((incident) => (
      incident.id === selected.id
        ? { ...incident, status: 'Team dispatched', time: 'Just now' }
        : incident
    )))

    setTeams(current => current.map(t => 
      t.name === selected.team
        ? { ...t, status: 'Dispatched', logs: [`Dispatched to ${selected.id} via ${selected.route}`, ...t.logs] }
        : t
    ))

    setDispatchAnimations(prev => ({
      ...prev,
      [selected.id]: {
        x: 50,
        y: 50,
        targetX: selected.lat,
        targetY: selected.lng,
        progress: 0,
        teamName: selected.team,
        icon: selected.icon
      }
    }))

    showNotification(`Emergency Dispatch Approved for ${selected.id}!`, 'success')
    logDev(`UPDATE incidents SET status='Team dispatched' WHERE id='${selected.id}';`, 'db')
    logDev(`UPDATE response_units SET status='Dispatched' WHERE name='${selected.team}';`, 'db')
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

    setTeams(current => current.map(t => 
      t.name === inc.team
        ? { ...t, status: 'Idle', logs: [`Completed response at ${id}`, ...t.logs] }
        : t
    ))

    showNotification(`Incident ${id} marked as Resolved. Team released.`, 'info')
    logDev(`UPDATE incidents SET status='Resolved' WHERE id='${id}';`, 'db')
    logDev(`UPDATE response_units SET status='Idle' WHERE name='${inc.team}';`, 'db')
  }

  // Preempt / Redirect Dispatch
  const confirmPreemptAndRedirect = () => {
    if (!selected || !preemptTargetIncidentId) return

    const preemptedIncidentId = selected.id
    const targetIncident = incidents.find(i => i.id === preemptTargetIncidentId)
    if (!targetIncident) return

    // 1. Reset preempted incident
    setIncidents(current => current.map(incident => {
      if (incident.id === preemptedIncidentId) {
        return { 
          ...incident, 
          status: 'Awaiting approval', 
          factors: [...incident.factors, `Preempted by operator from team ${incident.team}`]
        }
      }
      if (incident.id === preemptTargetIncidentId) {
        return { 
          ...incident, 
          status: 'Team dispatched', 
          time: 'Just now' 
        }
      }
      return incident
    }))

    // 2. Log team override
    setTeams(current => current.map(t => 
      t.name === selected.team
        ? { ...t, logs: [`PREEMPTED: Redirected from ${preemptedIncidentId} to ${preemptTargetIncidentId}`, ...t.logs] }
        : t
    ))

    // 3. Trigger new map animation starting from old coordinate to new coordinate
    setDispatchAnimations(prev => ({
      ...prev,
      [preemptTargetIncidentId]: {
        x: selected.lat,
        y: selected.lng,
        targetX: targetIncident.lat,
        targetY: targetIncident.lng,
        progress: 0,
        teamName: selected.team,
        icon: targetIncident.icon
      }
    }))

    showNotification(`Team redirected from ${preemptedIncidentId} to ${preemptTargetIncidentId}!`, 'warning')
    logDev(`PREEMPT TRIGGERED: Redirecting ${selected.team} from ${preemptedIncidentId} to ${preemptTargetIncidentId}.`, 'security')
    logDev(`UPDATE incidents SET status='Awaiting approval' WHERE id='${preemptedIncidentId}';`, 'db')
    logDev(`UPDATE incidents SET status='Team dispatched', team='${selected.team}' WHERE id='${preemptTargetIncidentId}';`, 'db')

    setPreemptDialogOpen(false)
    setPreemptTargetIncidentId('')
    setSelectedId(preemptTargetIncidentId)
  }

  // Two-Way Citizen SMS Chat Send
  const handleSendSms = (e) => {
    e.preventDefault()
    if (!smsInputText.trim() || !selected) return

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const operatorMsg = { sender: 'Operator', text: smsInputText, time }

    // Add msg
    setIncidents(current => current.map(incident => {
      if (incident.id === selected.id) {
        const history = incident.smsHistory ? [...incident.smsHistory, operatorMsg] : [operatorMsg]
        return { ...incident, smsHistory: history }
      }
      return incident
    }))

    setSmsInputText('')
    logDev(`SMS Sent to citizen: "${operatorMsg.text}"`, 'telecom')
    logDev(`INSERT INTO sms_logs (incident_id, sender, body) VALUES ('${selected.id}', 'Operator', '${operatorMsg.text}');`, 'db')

    // Simulate Citizen reply
    setTimeout(() => {
      const msg = operatorMsg.text.toLowerCase()
      let replyText = "Okay, standing by. Please keep us updated."

      // 1. Check for keyword matches in operator message
      if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey") || msg.includes("anyone there")) {
        replyText = `Hello operator, we are stranded here at ${selected.location}. Is help on the way?`
      } else if (msg.includes("where") || msg.includes("location") || msg.includes("landmark") || msg.includes("address")) {
        replyText = `We are right near the landmark at ${selected.location}. The water level is up to our knees.`
      } else if (msg.includes("stay") || msg.includes("clear") || msg.includes("safe") || msg.includes("calm") || msg.includes("indoor") || msg.includes("climb")) {
        replyText = `Understood. We are staying calm, keeping clear of the hazard, and waiting for the crew.`
      } else if (msg.includes("dispatch") || msg.includes("coming") || msg.includes("en route") || msg.includes("eta") || msg.includes("sent")) {
        replyText = `Thank you for the update! We will keep an eye out for the flashing lights.`
      } else {
        // 2. Fallback to hazard-specific rotation to prevent repetitive messages
        const historyLength = selected.smsHistory ? selected.smsHistory.length : 0
        const index = Math.floor(historyLength / 2) % 3 // Rotates between 0, 1, 2 for each exchange

        if (selected.type.toLowerCase().includes("wire")) {
          const wireReplies = [
            "We are staying clear of the sparking wire. It's making a loud buzzing sound in the water.",
            "Understood. The police haven't blocked the road yet, please alert the power grid team.",
            "Standing by. We have warned other commuters to not walk through the waterlogged street."
          ]
          replyText = wireReplies[index]
        } else if (selected.type.toLowerCase().includes("stranded")) {
          const strandedReplies = [
            "We are safe on the upper balcony. Cellar is completely submerged.",
            "Water is about 3 feet deep. Our grandparents are safe but we have no drinking water.",
            "Okay, we will wait here. Please tell the rescue team to bring a high-ground vehicle."
          ]
          replyText = strandedReplies[index]
        } else if (selected.type.toLowerCase().includes("drain")) {
          const drainReplies = [
            "Thanks. The municipal nala is completely clogged with plastic bottles.",
            "The water is starting to overflow onto the pavement. Hopefully the pumps arrive soon.",
            "Understood. We will keep you updated if the blockage causes more flooding."
          ]
          replyText = drainReplies[index]
        } else {
          const generalReplies = [
            "Understood, standing by for updates.",
            "The rain has slowed down slightly, but the waterlogging is still deep.",
            "Thank you for coordinate tracking. We are keeping safe."
          ]
          replyText = generalReplies[index]
        }
      }

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const citizenReply = { sender: 'Citizen', text: replyText, time: replyTime }

      setIncidents(current => current.map(incident => {
        if (incident.id === selected.id) {
          const history = incident.smsHistory ? [...incident.smsHistory, citizenReply] : [citizenReply]
          return { ...incident, smsHistory: history }
        }
        return incident
      }))

      logDev(`Incoming SMS from citizen: "${replyText}"`, 'telecom')
      logDev(`INSERT INTO sms_logs (incident_id, sender, body) VALUES ('${selected.id}', 'Citizen', '${replyText}');`, 'db')
      showNotification(`New citizen message received for ${selected.id}`, 'info')
    }, 2000)
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
    logDev(`MANUAL OVERRIDE: incident ${id} set to ${newPriority}.`, 'security')
    logDev(`UPDATE incidents SET priority='${newPriority}' WHERE id='${id}';`, 'db')
  }

  // Override / Assign alternate team
  const overrideTeam = (id, newTeam) => {
    setIncidents(current => current.map(incident => 
      incident.id === id 
        ? { ...incident, team: newTeam } 
        : incident
    ))
    showNotification(`Assigned alternate team: ${newTeam}`, 'info')
    logDev(`MANUAL TEAM REASSIGN: incident ${id} assigned ${newTeam}.`, 'security')
    logDev(`UPDATE incidents SET team='${newTeam}' WHERE id='${id}';`, 'db')
  }

  // Handle Citizen Form Submit
  const handleCitizenSubmit = (e) => {
    e.preventDefault()
    if (!citizenForm.description.trim()) {
      showNotification('Please enter a description of the emergency.', 'warning')
      return
    }

    const now = Date.now()
    if (now - lastSubmitTime < 20000) {
      const secondsLeft = Math.ceil((20000 - (now - lastSubmitTime)) / 1000)
      showNotification(`Spam protection active. Wait ${secondsLeft}s before filing another report.`, 'warning')
      return
    }
    setLastSubmitTime(now)

    const payload = { ...citizenForm }

    if (offlineMode) {
      setOfflineQueue(prev => [...prev, payload])
      showNotification('Device offline. Report stored in local backup queue.', 'warning')
      setCitizenForm(prev => ({ ...prev, description: '', name: '', phone: '' }))
      return
    }

    // AI Telemetry Logs
    const llmDetails = simulateLLMParse(payload.description, payload.type)
    logDev(`[LLM Call] Model: ${llmDetails.model} | Prompt length: ${llmDetails.prompt.length} chars`, 'ai')
    logDev(`[LLM Input] ${llmDetails.prompt}`, 'ai')
    logDev(`[LLM Output] Tokens: ${llmDetails.tokens} | Cost: $${llmDetails.cost} | JSON parsed successfully`, 'ai')

    // Process using explainable AI Engine
    const result = processCitizenReport(payload, incidents, weatherAlert)
    
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
      logDev(`Merged duplicate report into ${result.matchedId}. Score recalculated.`, 'system')
      logDev(`UPDATE incidents SET reports=reports+1, score=${result.updatedIncident.score} WHERE id='${result.matchedId}';`, 'db')
    } else {
      setIncidents(prev => [...prev, result.newIncident])
      showNotification(`New Triage Incident Created: ${result.newIncident.id}`, 'success')
      setSelectedId(result.newIncident.id)
      logDev(`Inserted new incident ${result.newIncident.id} into database.`, 'system')
      logDev(`INSERT INTO incidents (id, type, location, score, priority) VALUES ('${result.newIncident.id}', '${result.newIncident.type}', '${result.newIncident.location}', ${result.newIncident.score}, '${result.newIncident.priority}');`, 'db')
    }

    setCitizenForm(prev => ({ ...prev, description: '', name: '', phone: '' }))
  }

  // Handle IoT Sensor Triage Trigger
  const handleSensorTriage = (sensor) => {
    const mockReport = {
      name: `IoT System`,
      phone: `SENSOR-${sensor.id}`,
      location: sensor.landmark,
      type: sensor.type.includes('Drainage') ? 'drainage' : sensor.type.includes('Depth') ? 'waterlogging' : 'stranded',
      description: `AUTOMATED IoT ALERT: ${sensor.type} registered value ${sensor.value}${sensor.unit}. Urgency threshold exceeded.`,
      vulnerable: false,
      urgent: sensor.status === 'CRITICAL'
    }

    logDev(`Sensor telemetry threshold breach on ${sensor.id} at ${sensor.landmark}.`, 'iot')

    const result = processCitizenReport(mockReport, incidents, weatherAlert)
    if (result.isDuplicate) {
      setIncidents(prev => prev.map(inc => 
        inc.id === result.matchedId ? result.updatedIncident : inc
      ))
      showNotification(`Sensor Alert: Merged duplicate into ${result.matchedId}`, 'info')
      setSelectedId(result.matchedId)
    } else {
      setIncidents(prev => [...prev, result.newIncident])
      showNotification(`Sensor Alert: Registered new incident ${result.newIncident.id}`, 'success')
      setSelectedId(result.newIncident.id)
    }
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



  // Reroutable options (incidents needing response)
  const preemptTargetOptions = useMemo(() => {
    return incidents.filter(i => selected && i.id !== selected.id && i.status !== 'Resolved' && i.status !== 'Team dispatched')
  }, [incidents, selected])

  // Citizen-specific submitted reports list
  const citizenSubmissions = useMemo(() => {
    return incidents.filter(i => 
      i.linkedReports && i.linkedReports.some(rep => rep.phone !== 'Not provided' && !rep.phone.includes('SENSOR'))
    )
  }, [incidents])

  // Login Gateway screen
  if (!currentUserRole) {
    return (
      <div className="login-gateway">
        <div className="login-box">
          <div className="login-header">
            <span className="logo-icon">↟</span>
            <h2>FloodResponse AI</h2>
            <p>Monsoon Emergency Triage Gateway</p>
          </div>
          
          {!loginMode ? (
            <div className="role-choices">
              <button className="role-choice-btn citizen" onClick={() => setCurrentUserRole('citizen')}>
                <span className="icon">👤</span>
                <strong>Citizen Portal</strong>
                <small>Report flooding, live wires, or ask for rescue</small>
              </button>
              
              <button className="role-choice-btn operator" onClick={() => setLoginMode('operator')}>
                <span className="icon">⌘</span>
                <strong>AI Command Center</strong>
                <small>Dispatch teams, review rankings, and manage telemetry</small>
              </button>
            </div>
          ) : (
            <form onSubmit={handleOperatorLogin} className="operator-login-form">
              <h3>Operator Authentication</h3>
              <div className="form-group">
                <label htmlFor="login-username">Operator Username:</label>
                <input 
                  id="login-username"
                  type="text" 
                  value={operatorUser} 
                  onChange={e => setOperatorUser(e.target.value)} 
                  placeholder="Username (use: operator)"
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password:</label>
                <input 
                  id="login-password"
                  type="password" 
                  value={operatorPass} 
                  onChange={e => setOperatorPass(e.target.value)} 
                  placeholder="Password (use: password)"
                  required 
                />
              </div>
              {loginError && <p className="login-error-text">❌ {loginError}</p>}
              <div className="login-form-actions">
                <button type="button" className="btn-secondary" onClick={() => setLoginMode(null)}>Back</button>
                <button type="submit" className="approve-button">Authorize & Enter</button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  // CITIZEN VIEW PORTAL
  if (currentUserRole === 'citizen') {
    return (
      <main className="app-shell">
        <section className="workspace citizen-mode">
          <header className="topbar">
            <div>
              <p className="eyebrow">HYDERABAD MONSOON RESPONSE</p>
              <h1>Citizen Reporting Portal</h1>
              <p className="subhead">Report flooding hazards instantly. Track emergency dispatches below.</p>
            </div>
            <div className="top-actions">
              <button className="btn-secondary logout-btn" onClick={handleLogout}>Exit Portal</button>
            </div>
          </header>

          <section className="content-grid">
            <div className="citizen-form-section panel" style={{ padding: '22px' }}>
              <h2>Log Emergency Request</h2>
              <form onSubmit={handleCitizenSubmit} className="citizen-form">
                <div className="form-group">
                  <label htmlFor="cit-name">Your Name:</label>
                  <input 
                    id="cit-name"
                    type="text" 
                    placeholder="e.g. Kiran Kumar" 
                    value={citizenForm.name} 
                    onChange={e => setCitizenForm(prev => ({ ...prev, name: e.target.value }))}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cit-phone">Phone Number:</label>
                  <input 
                    id="cit-phone"
                    type="tel" 
                    placeholder="e.g. +91 98480 12345" 
                    value={citizenForm.phone} 
                    onChange={e => setCitizenForm(prev => ({ ...prev, phone: e.target.value }))}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cit-location">Landmark Area:</label>
                  <select 
                    id="cit-location"
                    value={citizenForm.location} 
                    onChange={e => setCitizenForm(prev => ({ ...prev, location: e.target.value }))}
                  >
                    {Object.keys(LANDMARKS).map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="cit-type">Emergency Category:</label>
                  <select 
                    id="cit-type"
                    value={citizenForm.type} 
                    onChange={e => setCitizenForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="waterlogging">Waterlogging on Street</option>
                    <option value="drainage">Blocked Stormwater Drainage</option>
                    <option value="stranded">Rescue Needed (Trapped residents)</option>
                    <option value="electrical">Live Wire / Sparking Electricity Hazard</option>
                  </select>
                </div>

                <div className="form-checkbox-row">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={citizenForm.vulnerable} 
                      onChange={e => setCitizenForm(prev => ({ ...prev, vulnerable: e.target.checked }))} 
                    />
                    Trapped infants / elderly family members involved
                  </label>

                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={citizenForm.urgent} 
                      onChange={e => setCitizenForm(prev => ({ ...prev, urgent: e.target.checked }))} 
                    />
                    Immediate life threat warning
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="cit-desc">Describe what is happening:</label>
                  <textarea 
                    id="cit-desc"
                    rows="3" 
                    placeholder="Provide specific details (water level heights, spark frequency, trapped location details)..."
                    value={citizenForm.description}
                    onChange={e => setCitizenForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-report-btn">🚀 Ingest and Triage Emergency</button>
              </form>
            </div>

            <div className="citizen-status-section panel" style={{ padding: '22px' }}>
              <h2>Active Rescue & Hazard Tracking</h2>
              <p className="panel-intro">Real-time status tracking for emergency calls.</p>
              
              <div className="submissions-tracking-list" style={{ marginTop: '15px', display: 'grid', gap: '12px' }}>
                {citizenSubmissions.map((sub) => (
                  <div key={sub.id} className="citizen-status-card" style={{ border: '1px solid #edf1ef', borderRadius: '8px', padding: '12px', background: '#fcfcfc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>{sub.type} ({sub.location})</strong>
                      <span className={`status ${sub.priority.toLowerCase()}`}>{sub.priority}</span>
                    </div>
                    
                    {/* Visual Progress bar tracker */}
                    <div className="progress-tracker-line" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', margin: '15px 0 10px', color: '#7a8683' }}>
                      <span style={{ fontWeight: 'bold', color: '#176f59' }}>✓ Submitted</span>
                      <span style={{ fontWeight: sub.score >= 50 ? 'bold' : 'normal', color: sub.score >= 50 ? '#176f59' : '#7a8683' }}>
                        {sub.status === 'Needs verification' ? '⌁ Verifying' : '✓ AI Triaged'}
                      </span>
                      <span style={{ fontWeight: sub.status === 'Team dispatched' || sub.status === 'Resolved' ? 'bold' : 'normal', color: sub.status === 'Team dispatched' || sub.status === 'Resolved' ? '#176f59' : '#7a8683' }}>
                        {sub.status === 'Team dispatched' ? '🚨 Team En Route' : 'Awaiting Dispatch'}
                      </span>
                      <span style={{ fontWeight: sub.status === 'Resolved' ? 'bold' : 'normal', color: sub.status === 'Resolved' ? '#37ae79' : '#7a8683' }}>
                        Resolved
                      </span>
                    </div>

                    <div style={{ fontSize: '10px', color: '#536763' }}>
                      <div><strong>Dispatch Details:</strong> {sub.status === 'Team dispatched' ? `Recommended team "${sub.team}" is en route via "${sub.route}". ETA: ${sub.eta}.` : sub.status === 'Resolved' ? 'Hazard successfully resolved and closed.' : 'AI recommendations compiled. Awaiting operator confirmation.'}</div>
                    </div>
                  </div>
                ))}
                
                {citizenSubmissions.length === 0 && (
                  <p className="empty-state">No emergency requests registered under your device profile yet.</p>
                )}
              </div>
            </div>
          </section>
        </section>
      </main>
    )
  }

  // OPERATOR FULL VIEW CONTROL ROOM
  return (
    <main className="app-shell">
      {/* Toast Alert Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          <span>{notification.type === 'success' ? '✓' : notification.type === 'warning' ? '⚠' : 'ℹ'}</span>
          {notification.message}
        </div>
      )}

      {/* Sidebar Navigation */}
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

        {/* FIXED: Accidental logout card click resolved */}
        <div className="operator" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="avatar">RS</div>
          <div style={{ flex: 1, minWidth: 0, paddingLeft: '8px' }}>
            <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>Ravi Sharma</strong>
            <small>Control room officer</small>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn-secondary" 
            title="Log Out Operator" 
            style={{ padding: '4px 6px', fontSize: '10px', background: '#24544c', border: 'none', color: '#afc4be' }}
          >
            🚪 Exit
          </button>
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
            {/* Offline Mode Toggle Simulator */}
            <button 
              className={`offline-toggle-btn ${offlineMode ? 'offline' : 'online'}`}
              onClick={() => {
                setOfflineMode(!offlineMode)
                showNotification(offlineMode ? 'Network connection restored.' : 'Network disconnected. Device operating offline.', offlineMode ? 'info' : 'warning')
              }}
              title={offlineMode ? 'Simulating offline state' : 'Network is online'}
            >
              {offlineMode ? '🔴 Offline Mode' : '🟢 Online Mode'}
            </button>

            {/* Weather Alert Selector */}
            <div className="weather-dropdown-container">
              <label htmlFor="weather-alert-select-op">Alert: </label>
              <select 
                id="weather-alert-select-op"
                value={weatherAlert} 
                onChange={(e) => {
                  setWeatherAlert(e.target.value)
                  showNotification(`Weather alert level shifted to ${e.target.value}`, 'warning')
                  logDev(`Weather alert shifted to ${e.target.value}. AI base weightings scaled.`, 'system')
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

        {/* Global Dashboard alert banner */}
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

              {/* Real Leaflet Map integration */}
              <div className="map-panel panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="panel-heading" style={{ padding: '22px 22px 10px' }}>
                  <div>
                    <p className="eyebrow">REAL GIS LIVE MAP</p>
                    <h2>Ameerpet Interactive Map</h2>
                  </div>
                  <button className="map-button" onClick={() => setView('Incident map')}>Fullscreen map</button>
                </div>
                
                <div className="map-canvas-container" style={{ flex: 1, minHeight: '293px', position: 'relative', margin: '0 22px 22px', border: '1px solid #e4ebe7', borderRadius: '8px' }}>
                  <MapContainer 
                    incidents={incidents}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    dispatchAnimations={dispatchAnimations}
                    mapPriorityFilter="All"
                    mapStatusFilter="All"
                    isMini={true}
                  />
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
                  {selected.score < 75 && selected.status === 'Awaiting approval' && (
                    <div style={{ marginBottom: '15px', background: 'rgba(233, 162, 86, 0.08)', border: '1px solid rgba(233, 162, 86, 0.2)', padding: '12px', borderRadius: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '10px', color: '#edf1ef', lineHeight: '1.4' }}>
                        <input 
                          type="checkbox" 
                          checked={operatorAuditChecked} 
                          onChange={(e) => setOperatorAuditChecked(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <span>⚠️ Low AI Confidence alert (&lt; 75%). I have audited route safety & dispatcher capabilities.</span>
                      </label>
                    </div>
                  )}

                  <button 
                    className="approve-button" 
                    disabled={selected.status === 'Team dispatched'} 
                    onClick={approveResponse}
                  >
                    {selected.status === 'Team dispatched' ? '✓ Team dispatched' : 'Approve response'}
                  </button>

                  {/* Preempt & Redirect dispatcher button */}
                  {selected.status === 'Team dispatched' && preemptTargetOptions.length > 0 && (
                    <button 
                      className="resolve-button btn-secondary" 
                      onClick={() => setPreemptDialogOpen(true)}
                      style={{ color: '#a06010', borderColor: '#fdd895', background: '#fffbf2' }}
                    >
                      🔄 Preempt & Redirect
                    </button>
                  )}

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

              {/* Preempt Dialog Selector Overlay */}
              {preemptDialogOpen && (
                <div className="preempt-overlay-dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
                  <div className="preempt-modal-box" style={{ background: 'white', padding: '24px', borderRadius: '11px', width: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                    <h3>Redirect Response Team</h3>
                    <p style={{ fontSize: '11px', color: '#536763', margin: '8px 0 15px' }}>
                      Redirect <strong>{selected.team}</strong> away from <strong>{selected.id}</strong> to a higher priority case. The current incident will return to the triage queue.
                    </p>
                    
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label htmlFor="preempt-target-select">Choose Target Incident:</label>
                      <select 
                        id="preempt-target-select"
                        value={preemptTargetIncidentId} 
                        onChange={e => setPreemptTargetIncidentId(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="">-- Select Pending Incident --</option>
                        {preemptTargetOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.id} [{opt.priority}] - {opt.location}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button className="resolve-button btn-secondary" onClick={() => setPreemptDialogOpen(false)}>Cancel</button>
                      <button className="approve-button" onClick={confirmPreemptAndRedirect} disabled={!preemptTargetIncidentId}>Confirm Redirect</button>
                    </div>
                  </div>
                </div>
              )}

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
                    <div ref={chatBottomRef} />
                  </div>
                  <div className="drawer-suggested-questions">
                    <button onClick={() => handleAIAsk("Why was this route selected?")}>Why was this route selected?</button>
                    <button onClick={() => handleAIAsk("Why recommends this specific response team?")}>Why recommends this team?</button>
                    <button onClick={() => handleAIAsk("Show raw telemetry details.")}>Show raw telemetry data</button>
                  </div>
                </div>
              )}

              {/* Two-Way Citizen Chat Log Console */}
              <div className="audit-trail-section citizen-chat-console" style={{ borderTop: '1px solid #edf1ef', marginTop: '18px', paddingTop: '15px' }}>
                <h5>💬 Two-Way Citizen Communication Log ({selected.id})</h5>
                <p className="panel-intro" style={{ marginBottom: '8px' }}>Send direct instructions or query coordinates. Citizen response is simulated in real-time.</p>
                
                <div className="citizen-sms-display" style={{ border: '1px solid #edf1ef', background: '#fbfdfc', height: '140px', overflowY: 'auto', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                  {selected.smsHistory && selected.smsHistory.map((sms, idx) => (
                    <div key={idx} className={`chat-bubble ${sms.sender === 'Operator' ? 'operator' : 'ai'}`} style={{ alignSelf: sms.sender === 'Operator' ? 'flex-end' : 'flex-start', background: sms.sender === 'Operator' ? '#176f59' : '#fff', border: sms.sender === 'Operator' ? 'none' : '1px solid #dce4e1', color: sms.sender === 'Operator' ? 'white' : '#253330', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', maxWidth: '80%' }}>
                      <strong>{sms.sender}:</strong> {sms.text} <small style={{ float: 'right', marginLeft: '10px', opacity: 0.7 }}>{sms.time}</small>
                    </div>
                  ))}
                  {(!selected.smsHistory || selected.smsHistory.length === 0) && (
                    <p style={{ color: '#7a8683', fontStyle: 'italic', fontSize: '10px', textAlign: 'center', margin: 'auto' }}>No message history. Initiate chat below.</p>
                  )}
                  <div ref={smsBottomRef} />
                </div>

                <form onSubmit={handleSendSms} style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    value={smsInputText} 
                    onChange={e => setSmsInputText(e.target.value)} 
                    placeholder={`Type instructions to citizen at ${selected.location}...`}
                    style={{ flex: 1, border: '1px solid #dce4e1', borderRadius: '8px', padding: '8px 10px', fontSize: '11px' }}
                  />
                  <button type="submit" className="approve-button" style={{ padding: '8px 15px' }}>Send</button>
                </form>
              </div>

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
              <h2>🗺️ Interactive GIS Triage Map</h2>
              <div className="map-filters">
                <div className="filter-group">
                  <label htmlFor="map-priority-select-fullscreen">Priority: </label>
                  <select 
                    id="map-priority-select-fullscreen"
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
                  <label htmlFor="map-status-select-fullscreen">Status: </label>
                  <select 
                    id="map-status-select-fullscreen"
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

            <div className="large-map-container" style={{ position: 'relative', height: '500px', border: '1px solid #e2eae7', borderRadius: '8px' }}>
              <MapContainer 
                incidents={incidents}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                dispatchAnimations={dispatchAnimations}
                mapPriorityFilter={mapPriorityFilter}
                mapStatusFilter={mapStatusFilter}
                isMini={false}
              />
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

        {/* CITIZEN REPORTS VIEW (SIMULATOR FOR OPERATORS) */}
        {view === 'Reports' && (
          <section className="citizen-portal panel">
            <div className="content-grid">
              <div className="citizen-form-section">
                <p className="eyebrow">CITIZEN REPORT SIMULATOR</p>
                <h2>Ingest Citizen Flooding Report</h2>
                <p className="panel-intro">Simulate incoming citizen calls to verify explainable AI prioritization and duplicate detection rules.</p>

                <form onSubmit={handleCitizenSubmit} className="citizen-form">
                  <div className="form-group">
                    <label htmlFor="cit-name-op-sim">Reporter Name:</label>
                    <input 
                      id="cit-name-op-sim"
                      type="text" 
                      placeholder="e.g. Anand Sharma" 
                      value={citizenForm.name} 
                      onChange={e => setCitizenForm(prev => ({ ...prev, name: e.target.value }))}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cit-phone-op-sim">Phone Number:</label>
                    <input 
                      id="cit-phone-op-sim"
                      type="tel" 
                      placeholder="e.g. +91 98480 12345" 
                      value={citizenForm.phone} 
                      onChange={e => setCitizenForm(prev => ({ ...prev, phone: e.target.value }))}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cit-location-op-sim">Area Landmark:</label>
                    <select 
                      id="cit-location-op-sim"
                      value={citizenForm.location} 
                      onChange={e => setCitizenForm(prev => ({ ...prev, location: e.target.value }))}
                    >
                      {Object.keys(LANDMARKS).map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cit-type-op-sim">Hazard Type:</label>
                    <select 
                      id="cit-type-op-sim"
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
                    <label htmlFor="cit-desc-op-sim">Description of Hazard:</label>
                    <textarea 
                      id="cit-desc-op-sim"
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

                {/* IoT Live Sensor Matrix */}
                <div className="iot-sensor-panel" style={{ marginTop: '20px', borderTop: '1px solid #edf1ef', paddingTop: '15px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: '#536763' }}>📡 Ameerpet IoT Telemetry Stream</h4>
                  <p className="panel-intro" style={{ marginBottom: '10px', fontSize: '10px' }}>Select an active sensor warning to trigger AI triage ingestion.</p>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {sensors.map(s => (
                      <div key={s.id} className={`sensor-strip-card ${s.status.toLowerCase()}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: '1px solid #edf1ef', borderRadius: '6px', background: s.status === 'CRITICAL' ? '#fff5f4' : s.status === 'WARNING' ? '#fffbf2' : 'white' }}>
                        <div>
                          <strong style={{ fontSize: '11px' }}>{s.id}: {s.type}</strong>
                          <div style={{ fontSize: '9px', color: '#7a8683' }}>{s.landmark}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'DM Mono', fontWeight: 'bold', fontSize: '12px', color: s.status === 'CRITICAL' ? '#c8493d' : s.status === 'WARNING' ? '#a06010' : '#176f59' }}>
                            {s.value}{s.unit}
                          </span>
                          <button 
                            type="button"
                            className="map-button" 
                            style={{ padding: '3px 6px', fontSize: '9px' }}
                            onClick={() => handleSensorTriage(s)}
                          >
                            Triage
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RETAINABLE DEV SYSTEM TELEMETRY LOGGER DRAWER */}
        <section className={`dev-telemetry-drawer ${devConsoleOpen ? 'expanded' : 'collapsed'}`} style={{ marginTop: '22px', border: '1px solid #dce4e1', borderRadius: '11px', background: '#1c2422', color: '#72ddad', overflow: 'hidden' }}>
          <header 
            className="drawer-bar" 
            onClick={() => setDevConsoleOpen(!devConsoleOpen)} 
            style={{ padding: '12px 18px', background: '#121817', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: devConsoleOpen ? '1px solid #2d3c39' : 'none' }}
          >
            <strong style={{ fontSize: '11px', fontFamily: 'DM Mono', letterSpacing: '0.8px', flex: 1 }}>⚙️ DEVELOPER SYSTEM TELEMETRY LOGGER (SQL & AI)</strong>
            <button style={{ background: 'none', border: 0, color: '#72ddad', cursor: 'pointer', fontSize: '11px' }}>
              {devConsoleOpen ? '▼ Hide Console' : '▲ Show Console'}
            </button>
          </header>

          {devConsoleOpen && (
            <div className="console-log-body" style={{ padding: '15px', maxHeight: '180px', overflowY: 'auto', fontFamily: 'DM Mono, monospace', fontSize: '10px', display: 'grid', gap: '5px' }}>
              {devLogs.map((log, idx) => (
                <div key={idx} className="console-log-row" style={{ borderBottom: '1px solid #25302e', paddingBottom: '3px', lineBreak: 'anywhere' }}>
                  {log}
                </div>
              ))}
              {devLogs.length === 0 && (
                <span style={{ color: '#8aa8a1', fontStyle: 'italic' }}>System idle. Awaiting operational triggers...</span>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
