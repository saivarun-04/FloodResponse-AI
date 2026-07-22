// Landmark coordinates for geofencing and duplicate checks
export const LANDMARKS = {
  "Bandlaguda Main Road, Hyderabad": { lat: 17.3486, lng: 78.4612 },
  "Telecom Colony, Alwal": { lat: 17.5011, lng: 78.5029 },
  "SR Nagar Metro Corridor": { lat: 17.4445, lng: 78.4410 },
  "Maitrivanam Nala stretch": { lat: 17.4385, lng: 78.4440 },
  "Ameerpet Metro Parking": { lat: 17.4357, lng: 78.4446 },
  "Maitrivanam junction, Ameerpet": { lat: 17.4368, lng: 78.4439 },
  "Buddhanagar, Lane 3": { lat: 17.4325, lng: 78.4465 },
  "Balkampet Main Road": { lat: 17.4410, lng: 78.4470 },
  "Ameerpet Metro approach": { lat: 17.4357, lng: 78.4446 },
  "Balkampet Lane 4": { lat: 17.4425, lng: 78.4485 },
  "Srinivasa Nagar": { lat: 17.4390, lng: 78.4412 },
  "Satyam Theatre Road": { lat: 17.4385, lng: 78.4440 },
  "Ameerpet Cross Roads": { lat: 17.4372, lng: 78.4452 },
  "Dharam Karam Road": { lat: 17.4412, lng: 78.4428 },
  "Leelanagar, Lane 2": { lat: 17.4348, lng: 78.4490 },
  "Sanjeeva Reddy Nagar (SR Nagar)": { lat: 17.4445, lng: 78.4410 },
  "Ameerpet Metro Station Parking": { lat: 17.4354, lng: 78.4430 }
};

// Base scoring for hazard types
const HAZARD_RULES = {
  "electrical": { baseScore: 75, priority: "Critical", icon: "⚡", team: "Electrical Emergency Team 02", route: "Balkampet Road" },
  "stranded": { baseScore: 65, priority: "High", icon: "🛟", team: "Disaster Response Unit 01", route: "Srinivasa Nagar Road" },
  "drainage": { baseScore: 45, priority: "Medium", icon: "🕳️", team: "Drainage Response Team 04", route: "Balkampet Main Road" },
  "waterlogging": { baseScore: 35, priority: "Low", icon: "🌊", team: "Traffic Diversion Team 03", route: "Metro service lane" }
};

/**
 * Simulates an LLM API call response and logs prompt metadata.
 */
export function simulateLLMParse(rawDescription, type) {
  const prompt = `SYSTEM: You are an emergency triage assistant. Analyze this citizen flood report:
REPORT: "${rawDescription}"
CLASSIFY: hazard_type (electrical, stranded, drainage, waterlogging), vulnerable_people (bool), immediate_urgency (bool).
OUTPUT FORMAT: JSON block only.`;
  const tokens = Math.floor(rawDescription.length * 1.2) + 115;
  const cost = (tokens * 0.0000015).toFixed(6);
  return {
    prompt,
    tokens,
    cost,
    model: "gemini-1.5-pro",
    parsed: {
      type: type,
      confidence: 0.96
    }
  };
}

/**
 * Calculates duplication confidence percentage between a new report and an existing incident.
 */
export function calculateDuplicateConfidence(report, incident) {
  let score = 0;

  // 1. Location match
  if (report.location.toLowerCase() === incident.location.toLowerCase()) {
    score += 50;
  } else if (
    report.location.toLowerCase().includes(incident.location.toLowerCase()) ||
    incident.location.toLowerCase().includes(report.location.toLowerCase())
  ) {
    score += 30;
  }

  // 2. Hazard category matching
  const repType = report.type.toLowerCase();
  const incType = incident.type.toLowerCase();
  
  if (repType === incType) {
    score += 30;
  } else if (
    (repType.includes("wire") || repType.includes("electrical")) && 
    (incType.includes("wire") || incType.includes("electrical"))
  ) {
    score += 30;
  } else if (
    (repType.includes("drain") || repType.includes("block")) &&
    (incType.includes("drain") || incType.includes("block"))
  ) {
    score += 30;
  } else if (
    (repType.includes("stranded") || repType.includes("rescue")) &&
    (incType.includes("stranded") || incType.includes("rescue"))
  ) {
    score += 30;
  }

  // 3. Keyword descriptions overlaps
  const reportWords = report.description.toLowerCase().split(/\s+/);
  const incidentWords = incident.reason.toLowerCase().split(/\s+/);
  const commonWords = reportWords.filter(w => w.length > 3 && incidentWords.includes(w));
  if (commonWords.length > 0) {
    score += Math.min(20, commonWords.length * 5);
  }

  return Math.min(100, score);
}

/**
 * Processes a citizen report and checks for duplicate merges or creates a new incident.
 */
export function processCitizenReport(report, existingIncidents, weatherAlertLevel = "Green") {
  // 1. Look for duplicate match (confidence > 65%)
  let bestMatch = null;
  let maxConfidence = 0;

  for (const incident of existingIncidents) {
    if (incident.status === 'Resolved') continue;
    const confidence = calculateDuplicateConfidence(report, incident);
    if (confidence > maxConfidence) {
      maxConfidence = confidence;
      bestMatch = incident;
    }
  }

  if (bestMatch && maxConfidence >= 65) {
    // Return update instructions for the matched incident
    const updatedReports = bestMatch.reports + 1;
    
    // Recalculate score based on more reports (corroboration)
    let newScore = bestMatch.score + 3; // +3 for additional corroborating report
    if (report.vulnerable) newScore += 10;
    if (report.urgent) newScore += 5;
    
    // Cap score at 100
    newScore = Math.min(100, newScore);

    // Dynamic priority classification
    let newPriority = bestMatch.priority;
    if (newScore >= 85) newPriority = "Critical";
    else if (newScore >= 65) newPriority = "High";
    else if (newScore >= 45) newPriority = "Medium";

    // Append to audit details
    const newFactors = [...bestMatch.factors];
    if (updatedReports >= 3 && !newFactors.includes("3 corroborating reports")) {
      newFactors.push("3 corroborating reports");
    } else if (updatedReports >= 5 && !newFactors.includes("5 corroborating reports")) {
      newFactors.push("5 corroborating reports");
    }
    if (report.vulnerable && !newFactors.includes("Vulnerable residents flagged")) {
      newFactors.push("Vulnerable residents flagged");
    }

    const updatedIncident = {
      ...bestMatch,
      reports: updatedReports,
      score: newScore,
      priority: newPriority,
      factors: newFactors,
      reason: `${bestMatch.reason} [Report updates: ${report.description}]`
    };

    return {
      isDuplicate: true,
      confidence: maxConfidence,
      matchedId: bestMatch.id,
      updatedIncident
    };
  }

  // 2. Create new incident using AI rules
  const hazardRule = HAZARD_RULES[report.type] || HAZARD_RULES["waterlogging"];
  const coords = LANDMARKS[report.location] || { lat: 17.4374 + (Math.random() - 0.5) * 0.01, lng: 78.4482 + (Math.random() - 0.5) * 0.01 };
  
  let aiScore = hazardRule.baseScore;
  const factors = ["Citizen reported"];

  // Apply risk multipliers
  if (report.vulnerable) {
    aiScore += 15;
    factors.push("Vulnerable residents");
  }
  if (report.urgent) {
    aiScore += 10;
    factors.push("Urgent hazard");
  }
  // Weather adjustments
  if (weatherAlertLevel === "Red") {
    aiScore += 15;
    factors.push("Red alert adjustment");
  } else if (weatherAlertLevel === "Yellow") {
    aiScore += 5;
    factors.push("Yellow alert adjustment");
  }

  // Special live electrical wire in standing water multiplier
  if (report.type === "electrical" && report.description.toLowerCase().includes("water")) {
    aiScore += 10;
    factors.push("Hazard in standing water");
  }

  aiScore = Math.min(100, Math.max(10, aiScore));

  let priority = hazardRule.priority;
  if (aiScore >= 85) priority = "Critical";
  else if (aiScore >= 65) priority = "High";
  else if (aiScore >= 45) priority = "Medium";
  else priority = "Low";

  // Generate unique ID
  const numId = 1000 + Math.floor(Math.random() * 1000);
  const newIncident = {
    id: `INC-${numId}`,
    type: report.type === "electrical" ? "Live electrical wire" :
          report.type === "stranded" ? "Stranded residents" :
          report.type === "drainage" ? "Blocked drainage" : "Waterlogged road",
    icon: hazardRule.icon,
    location: report.location,
    time: "Just now",
    priority: priority,
    score: aiScore,
    reports: 1,
    route: hazardRule.route,
    eta: `${10 + Math.floor(Math.random() * 15)} min`,
    team: hazardRule.team,
    reason: `Reported by citizen: "${report.description}". AI classified hazard severity at base ${hazardRule.baseScore} with multipliers.`,
    factors: factors,
    status: aiScore >= 50 ? "Awaiting approval" : "Needs verification",
    lat: coords.lat,
    lng: coords.lng,
    linkedReports: [
      {
        id: `REP-${Math.floor(Math.random()*10000)}`,
        name: report.name || "Anonymous Citizen",
        phone: report.phone || "Not provided",
        description: report.description,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  };

  return {
    isDuplicate: false,
    newIncident
  };
}

/**
 * Returns explainable AI trigger breakdown for interactive operator help.
 */
export function getAIExplanation(incident) {
  const explanation = {
    title: `AI Classification Audit for ${incident.id}`,
    baseHazardRating: "Moderate to severe based on incident classification.",
    rulesTriggered: []
  };

  if (incident.type.includes("wire") || incident.type.includes("electrical")) {
    explanation.baseHazardRating = "Critical risk (Electricity + Flooding risk is classified as a category-A life threat).";
    explanation.rulesTriggered.push("Rule EL-01: Live electricity near standing water raises score threshold by +15.");
  } else if (incident.type.includes("stranded") || incident.type.includes("residents")) {
    explanation.baseHazardRating = "High priority (Trapped civilians with potential vulnerability risk).";
    explanation.rulesTriggered.push("Rule DR-02: Stranded citizens triggers Disaster Response rescue unit recommendation.");
  }

  // Corroboration rule
  if (incident.reports > 1) {
    explanation.rulesTriggered.push(`Rule CR-03: Corroboration multiplier (+3 per linked report) applied for ${incident.reports} reports.`);
  }

  // Specific factors
  incident.factors.forEach(factor => {
    if (factor.includes("Vulnerable")) {
      explanation.rulesTriggered.push("Rule VL-09: Vulnerable elderly or infant residents flagged. Priority boosted by +15.");
    }
    if (factor.includes("Emergency route")) {
      explanation.rulesTriggered.push("Rule RT-05: Critical ambulance/emergency corridor affected. Route bypass recommended.");
    }
  });

  return explanation;
}
