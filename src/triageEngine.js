// Landmark coordinates for geofencing and duplicate checks
export const LANDMARKS = {
  "Maitrivanam junction, Ameerpet": { x: 66, y: 29 },
  "Buddhanagar, Lane 3": { x: 37, y: 55 },
  "Balkampet Main Road": { x: 72, y: 70 },
  "Ameerpet Metro approach": { x: 22, y: 31 },
  "Balkampet Lane 4": { x: 50, y: 80 },
  "Srinivasa Nagar": { x: 45, y: 40 }
};

// Base scoring for hazard types
const HAZARD_RULES = {
  "electrical": { baseScore: 75, priority: "Critical", icon: "⚡", team: "Electrical Emergency Team 02", route: "Balkampet Road" },
  "stranded": { baseScore: 65, priority: "High", icon: "🛟", team: "Disaster Response Unit 01", route: "Srinivasa Nagar Road" },
  "drainage": { baseScore: 45, priority: "Medium", icon: "🕳️", team: "Drainage Response Team 04", route: "Balkampet Main Road" },
  "waterlogging": { baseScore: 35, priority: "Low", icon: "🌊", team: "Traffic Diversion Team 03", route: "Metro service lane" }
};

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
  const coords = LANDMARKS[report.location] || { x: 40 + Math.random() * 20, y: 40 + Math.random() * 20 };
  
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
    x: coords.x,
    y: coords.y,
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
