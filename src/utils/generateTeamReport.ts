// Sea Zero — Complete Team Performance Report Generator
// Generates a standalone, beautifully styled HTML performance report with
// embedded SVG graphs, complete decisions, operational metrics, financial cash flows,
// and environmental emissions. Can be opened offline or printed directly to PDF.

import { Submission } from '@/store/persistence';

function formatMoney(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function generateTeamReportHtml(sub: Submission): string {
  const { teamName, teamColor, config, simResult, economics, emissions, score, breakdown, submittedAt } = sub;
  const isFeasible = simResult.feasible;
  const submittedDateStr = new Date(submittedAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const chargingPortsCount = config.portConfigs.filter((p) => p.hasCharger).length;
  const bufferBatteryCount = config.portConfigs.filter((p) => p.hasBufferBattery).length;

  // Render NPV Component Bar Chart as inline SVG
  const npvBarsSvg = economics.npvComponents
    .map((comp, idx) => {
      const maxVal = Math.max(
        ...economics.npvComponents.map((c) => Math.max(Math.abs(c.evCost), Math.abs(c.iceCost)))
      );
      const evWidth = maxVal > 0 ? (Math.abs(comp.evCost) / maxVal) * 220 : 0;
      const iceWidth = maxVal > 0 ? (Math.abs(comp.iceCost) / maxVal) * 220 : 0;
      const y = idx * 48 + 30;

      return `
        <g transform="translate(0, ${y})">
          <text x="140" y="14" font-size="11" font-weight="600" fill="#a1a1aa" text-anchor="end">${comp.category}</text>
          <!-- EV Bar -->
          <rect x="150" y="2" width="${Math.max(evWidth, 4)}" height="14" fill="#06b6d4" rx="3" />
          <text x="${158 + evWidth}" y="13" font-size="10" fill="#06b6d4" font-family="monospace">${formatMoney(comp.evCost)}</text>
          <!-- ICE Bar -->
          <rect x="150" y="20" width="${Math.max(iceWidth, 4)}" height="14" fill="#3b82f6" rx="3" />
          <text x="${158 + iceWidth}" y="31" font-size="10" fill="#3b82f6" font-family="monospace">${formatMoney(comp.iceCost)}</text>
        </g>
      `;
    })
    .join('');

  // Render Cumulative CO2 Trajectory Chart as inline SVG
  const maxCo2 = Math.max(
    ...(emissions.iceCumulativeCO2 || []),
    ...(emissions.evCumulativeCO2 || []),
    1
  );

  const evPoints = (emissions.evCumulativeCO2 || [])
    .map((val, year) => {
      const x = 50 + (year / 10) * 480;
      const y = 180 - (val / maxCo2) * 150;
      return `${x},${y}`;
    })
    .join(' ');

  const icePoints = (emissions.iceCumulativeCO2 || [])
    .map((val, year) => {
      const x = 50 + (year / 10) * 480;
      const y = 180 - (val / maxCo2) * 150;
      return `${x},${y}`;
    })
    .join(' ');

  const chartYearsGrid = Array.from({ length: 11 }, (_, i) => {
    const x = 50 + (i / 10) * 480;
    return `
      <line x1="${x}" y1="20" x2="${x}" y2="180" stroke="#27272a" stroke-dasharray="3,3" />
      <text x="${x}" y="196" font-size="10" fill="#71717a" text-anchor="middle" font-family="monospace">Yr ${i}</text>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Performance Report — ${teamName}</title>
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #18181b;
      --card-border: #27272a;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --cyan: #06b6d4;
      --green: #10b981;
      --amber: #f59e0b;
      --red: #ef4444;
      --blue: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 32px;
      line-height: 1.5;
    }
    .container { max-width: 960px; margin: 0 auto; }
    
    /* Header */
    .header {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-left: 6px solid ${teamColor};
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .team-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
      font-weight: 800;
      color: var(--text);
    }
    .team-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: ${teamColor};
    }
    .meta { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
    .score-box {
      text-align: right;
    }
    .score-val {
      font-size: 32px;
      font-weight: 800;
      font-family: monospace;
      color: ${score < 0 ? 'var(--green)' : score < 50 ? 'var(--amber)' : 'var(--red)'};
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .badge-feasible { background: rgba(16,185,129,0.15); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }
    .badge-infeasible { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }

    /* Section Cards */
    .section {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--cyan);
      margin-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 8px;
    }
    
    /* Metrics Grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .metric-card {
      background: #09090b;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 12px 16px;
    }
    .metric-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
    .metric-value { font-size: 20px; font-weight: 700; font-family: monospace; margin-top: 4px; }
    
    /* Data Tables */
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--card-border); }
    th { background: #09090b; color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 10px; }
    td.mono { font-family: monospace; }
    tr:hover { background: rgba(255,255,255,0.02); }

    .chart-container {
      background: #09090b;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
      overflow-x: auto;
    }

    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .container { max-width: 100%; }
      .section, .header, .metric-card, .chart-container {
        background: #fff !important;
        color: #000 !important;
        border: 1px solid #ccc !important;
        box-shadow: none !important;
        break-inside: avoid;
      }
      .section-title { color: #000 !important; border-color: #ccc !important; }
      th { background: #f0f0f0 !important; color: #333 !important; }
      td, th { border-color: #eee !important; color: #000 !important; }
      .metric-label { color: #555 !important; }
      .metric-value { color: #000 !important; }
      .score-val { color: #000 !important; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Action Bar for Web Viewing -->
    <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: flex-end; gap: 12px;">
      <button onclick="window.print()" style="background: var(--cyan); color: #000; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;">
        Print / Save to PDF
      </button>
    </div>

    <!-- Header -->
    <div class="header">
      <div>
        <div class="team-badge">
          <div class="team-dot"></div>
          ${teamName}
        </div>
        <div class="meta">
          Submitted: ${submittedDateStr} &bull; Submission ID: ${sub.id}
        </div>
        <div style="margin-top: 12px;">
          <span class="badge ${isFeasible ? 'badge-feasible' : 'badge-infeasible'}">
            ${isFeasible ? '✓ 100% Feasible Voyage' : '✕ Infeasible Configuration'}
          </span>
          ${!isFeasible ? `<p style="color: var(--red); font-size: 11px; margin-top: 6px;"><strong>Reason:</strong> ${simResult.infeasibleReason}</p>` : ''}
        </div>
      </div>
      <div class="score-box">
        <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Overall Score</div>
        <div class="score-val">${score.toFixed(1)}</div>
        <div style="font-size: 10px; color: var(--text-muted);">(Lower is better)</div>
      </div>
    </div>

    <!-- Executive Summary & Score Breakdown -->
    <div class="section">
      <div class="section-title">Score Breakdown</div>
      <div class="grid">
        <div class="metric-card">
          <div class="metric-label">Feasibility Bonus</div>
          <div class="metric-value" style="color: ${breakdown.feasibilityBonus < 0 ? 'var(--green)' : 'var(--text-muted)'}">${breakdown.feasibilityBonus}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Dead Zone Penalty</div>
          <div class="metric-value" style="color: ${breakdown.deadZonePenalty > 0 ? 'var(--red)' : 'var(--green)'}">${breakdown.deadZonePenalty}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">NPV Score ($1M = 1pt)</div>
          <div class="metric-value" style="color: ${breakdown.npvScore < 0 ? 'var(--green)' : 'var(--amber)'}">${breakdown.npvScore}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">CO₂ Score (1kt = -1pt)</div>
          <div class="metric-value" style="color: ${breakdown.co2Score < 0 ? 'var(--green)' : 'var(--red)'}">${breakdown.co2Score}</div>
        </div>
      </div>
    </div>

    <!-- Team Decisions / Configuration -->
    <div class="section">
      <div class="section-title">1. Strategic Decisions & Configuration</div>
      <div class="grid">
        <div class="metric-card">
          <div class="metric-label">Vessel Type</div>
          <div class="metric-value" style="color: var(--cyan);">${config.vesselType.toUpperCase()}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Battery Capacity</div>
          <div class="metric-value">${config.batteryMWh} MWh</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Service Speed</div>
          <div class="metric-value">${config.speedKnots.toFixed(1)} knots</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Charger Rating</div>
          <div class="metric-value">${config.chargePowerMW} MW</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Decision Parameter</th>
            <th>Configured Value</th>
            <th>Baseline Benchmark</th>
            <th>Impact Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Cargo Load</strong></td>
            <td class="mono">${config.cargoLoadPercent}%</td>
            <td class="mono">70%</td>
            <td>Affects vessel displacement & propulsion demand</td>
          </tr>
          <tr>
            <td><strong>Efficiency Package</strong></td>
            <td class="mono">${config.efficiencyPackage ? 'Enabled ($30M)' : 'Disabled'}</td>
            <td class="mono">Enabled</td>
            <td>Reduces energy consumption by 40%</td>
          </tr>
          <tr>
            <td><strong>Battery Reserve Floor</strong></td>
            <td class="mono">${config.reservePercent}%</td>
            <td class="mono">15%</td>
            <td>Safety threshold before triggering dead zones</td>
          </tr>
          <tr>
            <td><strong>Sea Margin Factor</strong></td>
            <td class="mono">${config.seaMarginPercent}%</td>
            <td class="mono">15%</td>
            <td>Weather and wave resistance allowance</td>
          </tr>
          <tr>
            <td><strong>Carbon Shadow Price</strong></td>
            <td class="mono">$${config.carbonPricePerTon}/tonne</td>
            <td class="mono">$190/tonne</td>
            <td>Applied to CO2e emissions over 10-year lifespan</td>
          </tr>
          <tr>
            <td><strong>Charging Network</strong></td>
            <td class="mono">${chargingPortsCount} Ports with Chargers</td>
            <td class="mono">All Hubs</td>
            <td>${bufferBatteryCount} Ports equipped with Buffer Batteries</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Operational Performance -->
    <div class="section">
      <div class="section-title">2. Operational Performance</div>
      <div class="grid">
        <div class="metric-card">
          <div class="metric-label">Total Distance</div>
          <div class="metric-value">${Math.round(simResult.totalDistanceKm).toLocaleString()} km</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Actual Voyage Duration</div>
          <div class="metric-value">${simResult.actualVoyageHours.toFixed(1)} hrs</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Schedule Deviation</div>
          <div class="metric-value" style="color: ${simResult.onSchedule ? 'var(--green)' : 'var(--red)'}">${simResult.scheduleDeviationHours > 0 ? '+' : ''}${simResult.scheduleDeviationHours.toFixed(1)} hrs</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Dead Zones Hit</div>
          <div class="metric-value" style="color: ${simResult.deadZoneCount === 0 ? 'var(--green)' : 'var(--red)'}">${simResult.deadZoneCount}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Operational Metric</th>
            <th>EV Result</th>
            <th>ICE Benchmark</th>
            <th>Variance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Total Delivered Energy</strong></td>
            <td class="mono">${Math.round(simResult.totalEnergyMWh).toLocaleString()} MWh</td>
            <td class="mono">${Math.round(simResult.totalEnergyMWh).toLocaleString()} MWh</td>
            <td class="mono">—</td>
          </tr>
          <tr>
            <td><strong>Grid Energy Bought</strong></td>
            <td class="mono">${Math.round(simResult.totalGridEnergyMWh).toLocaleString()} MWh</td>
            <td class="mono">0 MWh</td>
            <td class="mono">+${Math.round(simResult.totalGridEnergyMWh).toLocaleString()} MWh</td>
          </tr>
          <tr>
            <td><strong>Fuel Consumed</strong></td>
            <td class="mono">0 Tonnes</td>
            <td class="mono">${Math.round(simResult.totalFuelTonnes).toLocaleString()} Tonnes</td>
            <td class="mono">-${Math.round(simResult.totalFuelTonnes).toLocaleString()} Tonnes</td>
          </tr>
          <tr>
            <td><strong>Charging Window Available</strong></td>
            <td class="mono">${simResult.chargingWindowHours.toFixed(1)} hrs</td>
            <td class="mono">N/A</td>
            <td class="mono">Capacity: ${Math.round(simResult.chargingCapacityMWh)} MWh</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Financial Performance & Graphs -->
    <div class="section">
      <div class="section-title">3. Financial Performance & TCO Analysis</div>
      <div class="grid">
        <div class="metric-card">
          <div class="metric-label">10-Year EV TCO (Discounted)</div>
          <div class="metric-value">${formatMoney(economics.evTotalTCO)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">10-Year ICE TCO (Discounted)</div>
          <div class="metric-value">${formatMoney(economics.iceTotalTCO)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Net NPV Gap (EV - ICE)</div>
          <div class="metric-value" style="color: ${economics.npvGap < 0 ? 'var(--green)' : 'var(--red)'}">${formatMoney(economics.npvGap)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Abatement Cost</div>
          <div class="metric-value" style="color: var(--cyan)">${economics.costPerTonCO2Abated ? `$${Math.round(economics.costPerTonCO2Abated)}/t` : 'N/A'}</div>
        </div>
      </div>

      <!-- Cost Component Breakdown Graph -->
      <div class="chart-container">
        <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px;">
          Discounted 10-Year Cost Component Breakdown (EV Cyan vs ICE Blue)
        </div>
        <svg width="100%" height="${economics.npvComponents.length * 48 + 40}" viewBox="0 0 500 ${economics.npvComponents.length * 48 + 40}">
          ${npvBarsSvg}
        </svg>
      </div>

      <!-- Annual Cash Flows Table -->
      <table style="margin-top: 20px;">
        <thead>
          <tr>
            <th>Year</th>
            <th>EV Total Cost</th>
            <th>ICE Total Cost</th>
            <th>Annual Delta (EV - ICE)</th>
            <th>Discounted Delta</th>
          </tr>
        </thead>
        <tbody>
          ${economics.annualCashFlows.map((cf) => `
            <tr>
              <td class="mono">Year ${cf.year}${cf.year === 0 ? ' (Capex)' : ''}</td>
              <td class="mono">${formatMoney(cf.evTotal)}</td>
              <td class="mono">${formatMoney(cf.iceTotal)}</td>
              <td class="mono" style="color: ${cf.delta < 0 ? 'var(--green)' : 'var(--red)'}">${formatMoney(cf.delta)}</td>
              <td class="mono" style="color: ${cf.deltaDiscounted < 0 ? 'var(--green)' : 'var(--red)'}">${formatMoney(cf.deltaDiscounted)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Environmental Impact & Trajectory -->
    <div class="section">
      <div class="section-title">4. Environmental Impact & Emissions Trajectory</div>
      <div class="grid">
        <div class="metric-card">
          <div class="metric-label">EV CO₂ per Voyage</div>
          <div class="metric-value">${emissions.evCO2PerVoyageTons.toFixed(1)} t</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">ICE CO₂ per Voyage</div>
          <div class="metric-value">${emissions.iceCO2PerVoyageTons.toFixed(1)} t</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">10-Year CO₂ Abated</div>
          <div class="metric-value" style="color: var(--cyan)">${Math.round(emissions.co2Abated10yr).toLocaleString()} t</div>
        </div>
      </div>

      <!-- Cumulative CO2 Chart -->
      <div class="chart-container">
        <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px;">
          10-Year Cumulative CO₂ Emissions Trajectory (tCO₂e)
        </div>
        <svg width="100%" height="220" viewBox="0 0 560 220">
          ${chartYearsGrid}
          <!-- ICE Trajectory (Blue) -->
          <polyline points="${icePoints}" fill="none" stroke="#3b82f6" stroke-width="3" />
          <!-- EV Trajectory (Cyan) -->
          <polyline points="${evPoints}" fill="none" stroke="#06b6d4" stroke-width="3" />
        </svg>
        <div style="display: flex; gap: 24px; justify-content: center; font-size: 11px; margin-top: 8px;">
          <span style="color: #06b6d4; font-weight: 700;">&bull; EV Cumulative CO₂</span>
          <span style="color: #3b82f6; font-weight: 700;">&bull; ICE Cumulative CO₂</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadTeamReport(sub: Submission): void {
  const htmlContent = generateTeamReportHtml(sub);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeName = sub.teamName.replace(/[^a-z0-9_-]/gi, '_');
  const filename = `${safeName}_Performance_Report.html`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
