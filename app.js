// --- MVP Config & Mock Data ---

const SME_PROFILE = {
    name: "Al-Barakah Construction LLC",
    crNumber: "1010123456",
    industry: "Construction",
    founded: 2018,
    zatcaLinked: true,
    samaLinked: true
};

// Conversion Factors (Mock rules engine): 
// How much CO2 (in kg) does 1 SAR spent on this category produce?
const CARBON_CONVERSION_FACTORS = {
    "electricity": 0.45,  // e.g., 1 SAR of SEC power = 0.45 kg CO2 
    "fuel": 0.82,         // diesel/petrol
    "raw_materials": 1.2, // steel, concrete
    "logistics": 0.6,
    "software": 0.01      // negligible
};

// Mock Open Banking API response (last 30 days)
const MOCK_TRANSACTIONS = [
    { id: "TX101", date: "2024-10-25", vendor: "Saudi Electricity Company", category: "electricity", amount_sar: 12500, scope: 2 },
    { id: "TX102", date: "2024-10-24", vendor: "Aramco Fuel Station", category: "fuel", amount_sar: 8400, scope: 1 },
    { id: "TX103", date: "2024-10-22", vendor: "SABIC Materials", category: "raw_materials", amount_sar: 15000, scope: 3 }, // LOWERED FOR DEMO
    { id: "TX104", date: "2024-10-20", vendor: "Naqel Logistics", category: "logistics", amount_sar: 3200, scope: 3 },
    { id: "TX105", date: "2024-10-20", vendor: "Aramco Fuel Station", category: "fuel", amount_sar: 6100, scope: 1 },
    { id: "TX106", date: "2024-10-18", vendor: "Saudi Electricity Company", category: "electricity", amount_sar: 2100, scope: 2 },
    { id: "TX107", date: "2024-10-15", vendor: "Azure Cloud Middle East", category: "software", amount_sar: 1500, scope: 3 },
    { id: "TX108", date: "2024-10-12", vendor: "SABIC Materials", category: "raw_materials", amount_sar: 18000, scope: 3 }
];


// --- The Core Calculation Engine ---

function calculateCarbonMetrics(transactions) {
    let totalFootprint = 0; // in kg
    let scopeData = { 1: 0, 2: 0, 3: 0 };

    // Process transactions into CO2 footprint
    const enrichedTransactions = transactions.map(tx => {
        const factor = CARBON_CONVERSION_FACTORS[tx.category] || 0.1;
        const emissions = tx.amount_sar * factor; // AI Translation rule

        totalFootprint += emissions;
        scopeData[tx.scope] += emissions;

        return { ...tx, co2_kg: emissions };
    });

    // Convert kg to metric tons for display
    const totalTons = totalFootprint / 1000;

    // Mock ESG Algorithm: 100 is perfect, 0 is terrible.
    // Let's say baseline for this size construction co is 120 tons/month.
    const baselineTons = 120;
    let esgScore = 100 - ((totalTons / baselineTons) * 50);
    esgScore = Math.max(0, Math.min(esgScore, 100)); // Clamp between 0-100

    return {
        totalEmissionsTons: totalTons.toFixed(2),
        esgScore: Math.round(esgScore),
        scope1Tons: (scopeData[1] / 1000).toFixed(2),
        scope2Tons: (scopeData[2] / 1000).toFixed(2),
        scope3Tons: (scopeData[3] / 1000).toFixed(2),
        transactions: enrichedTransactions
    };
}


// --- UI Registration & Component Rendering ---

document.addEventListener('DOMContentLoaded', () => {
    // Inject Profile Data Context
    document.getElementById('sme-name-sidebar').innerText = SME_PROFILE.name;
    document.getElementById('sme-cr-sidebar').innerText = SME_PROFILE.crNumber;

    // Run the Calculation Engine
    const metrics = calculateCarbonMetrics(MOCK_TRANSACTIONS);

    // Listen to Navigation
    const navItems = {
        'nav-dashboard': () => renderDashboard(metrics),
        'nav-transactions': () => renderTransactionFeed(metrics),
        'nav-financing': () => renderFinancingCenter(metrics)
    };

    Object.keys(navItems).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                // Update active state
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active', 'bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/20'));
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.add('text-slate-400'));

                el.classList.remove('text-slate-400');
                el.classList.add('active', 'bg-emerald-500/10', 'text-emerald-400', 'border', 'border-emerald-500/20');

                navItems[id](); // render view
                lucide.createIcons(); // refresh icons newly added to DOM
            });
        }
    });

    // Initial Load
    renderDashboard(metrics);
});

// --- View: Dashboard ---
function renderDashboard(metrics) {
    const appContent = document.getElementById('app-content');

    // Color coding the score
    const scoreColorClass = metrics.esgScore > 75 ? 'text-emerald-400' : 'text-amber-400';

    appContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Core Metric Card -->
            <div class="glass-panel rounded-2xl p-6 hover-glow relative overflow-hidden group">
                <div class="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <p class="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Carbon Footprint</p>
                        <h3 class="text-4xl font-heading font-bold text-white">${metrics.totalEmissionsTons} <span class="text-lg text-slate-500 font-medium">tCO2e</span></h3>
                    </div>
                    <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 shadow-inner">
                        <i data-lucide="cloud-fog" class="w-6 h-6 text-slate-300"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2 mt-6 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <i data-lucide="trending-down" class="w-4 h-4 text-emerald-400"></i>
                    <p class="text-xs text-emerald-400 font-medium">-12% vs last month</p>
                </div>
            </div>

            <!-- The ESG Score Ring -->
            <div class="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center relative hover-glow">
                <p class="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 w-full text-left">Real-Time ESG Score</p>
                <div class="score-ring w-32 h-32" style="--score: ${metrics.esgScore};">
                    <div class="score-value text-center tracking-tight">
                        <h2 class="text-4xl font-heading font-bold ${scoreColorClass} drop-shadow-md">${metrics.esgScore}</h2>
                        <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">/ 100</span>
                    </div>
                </div>
                <p class="text-xs text-slate-300 mt-4 text-center max-w-[200px]">Classified as <b>Prime Green</b>. Eligible for subsidized Vision 2030 capital.</p>
            </div>

            <!-- Scope Breakdown -->
            <div class="glass-panel rounded-2xl p-6 hover-glow">
                <p class="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Emissions Sandbox (Scopes)</p>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-slate-300 font-medium">Scope 1 (Direct Fuels)</span>
                            <span class="text-white font-bold">${metrics.scope1Tons}t</span>
                        </div>
                        <div class="w-full bg-slate-800 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full" style="width: 25%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-slate-300 font-medium">Scope 2 (Electricity)</span>
                            <span class="text-white font-bold">${metrics.scope2Tons}t</span>
                        </div>
                        <div class="w-full bg-slate-800 rounded-full h-2">
                            <div class="bg-emerald-400 h-2 rounded-full" style="width: 15%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-slate-300 font-medium">Scope 3 (Supply Chain)</span>
                            <span class="text-white font-bold">${metrics.scope3Tons}t</span>
                        </div>
                        <div class="w-full bg-slate-800 rounded-full h-2">
                            <div class="bg-amber-400 h-2 rounded-full" style="width: 60%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Financial Nexus / Graph Area -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="glass-panel rounded-2xl p-6">
                 <div class="flex justify-between items-center mb-6">
                    <h3 class="font-heading font-semibold text-lg text-white">Carbon Trajectory</h3>
                    <select class="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-300 outline-none">
                        <option>Last 30 Days</option>
                    </select>
                </div>
                <div class="h-64 relative w-full">
                    <canvas id="emissionsChart"></canvas>
                </div>
            </div>

             <div class="glass-panel rounded-2xl p-0 overflow-hidden flex flex-col">
                <div class="p-6 border-b border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
                    <h3 class="font-heading font-semibold text-lg text-white">Recent Top Emitters (Ingested)</h3>
                    <span class="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 font-medium">Live from SAMA</span>
                </div>
                <div class="flex-1 overflow-y-auto p-2">
                    ${metrics.transactions.slice(0, 4).map(tx => `
                        <div class="flex items-center justify-between p-3 hover:bg-slate-800/50 rounded-xl transition-colors mb-1">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                    <i data-lucide="${getIconForCategory(tx.category)}" class="w-4 h-4 text-slate-400"></i>
                                </div>
                                <div>
                                    <p class="text-sm font-semibold text-white">${tx.vendor}</p>
                                    <p class="text-[10px] text-slate-500 uppercase tracking-wider">${tx.date} &bull; Scope ${tx.scope}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-bold text-amber-500">${(tx.co2_kg / 1000).toFixed(2)} tCO2</p>
                                <p class="text-[10px] text-slate-500 font-medium">${tx.amount_sar.toLocaleString()} SAR</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="p-3 bg-slate-800/50 border-t border-slate-700/50 text-center">
                    <button class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest" onclick="document.getElementById('nav-transactions').click()">View Full Ledger &rarr;</button>
                </div>
            </div>
        </div>
    `;

    // Initialize Chart.js after DOM rendering
    setTimeout(() => initChart(), 100);
}

// --- View: Transaction Feed ---
function renderTransactionFeed(metrics) {
    const appContent = document.getElementById('app-content');

    appContent.innerHTML = `
         <div class="mb-8">
            <h2 class="text-2xl font-heading font-bold text-white mb-2">Open Banking Carbon Ledger</h2>
            <p class="text-sm text-slate-400 max-w-2xl">All corporate expenses pulled via SAMA Open Banking APIs and automatically run through the AI conversion engine to calculate equivalent greenhouse gas emissions.</p>
        </div>

        <div class="glass-panel rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
            <table class="w-full text-left text-sm text-slate-300">
                <thead class="text-xs text-slate-400 uppercase tracking-wider bg-slate-800/80 border-b border-slate-700/50">
                    <tr>
                        <th class="px-6 py-4 font-semibold">Transaction / Date</th>
                        <th class="px-6 py-4 font-semibold">Vendor</th>
                        <th class="px-6 py-4 font-semibold">Financial Value</th>
                        <th class="px-6 py-4 font-semibold">GHG Protocol</th>
                        <th class="px-6 py-4 font-semibold text-right">Calculated Footprint</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/50">
                    ${metrics.transactions.map((tx, idx) => `
                        <tr class="hover:bg-slate-800/30 transition-colors ${idx === 0 ? 'bg-emerald-500/5 relative' : ''}">
                            <td class="px-6 py-4">
                                ${idx === 0 ? '<span class="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-md"></span>' : ''}
                                <div class="font-medium text-white">${tx.id}</div>
                                <div class="text-[10px] text-slate-500 mt-1">${tx.date}</div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-medium inline-block mb-1">${tx.category}</span>
                                <div class="font-semibold text-slate-200">${tx.vendor}</div>
                            </td>
                            <td class="px-6 py-4 font-mono text-slate-300">
                                SAR ${tx.amount_sar.toLocaleString()}
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getScopeColor(tx.scope)}">Scope ${tx.scope}</span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="font-bold text-amber-500">${(tx.co2_kg / 1000).toFixed(3)} tCO2e</div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    lucide.createIcons();
}

// --- View: Green Capital (Financing) ---
function renderFinancingCenter(metrics) {
    const appContent = document.getElementById('app-content');

    const isEligible = metrics.esgScore >= 70;

    appContent.innerHTML = `
        <div class="mb-8 flex justify-between items-end">
            <div>
                <h2 class="text-2xl font-heading font-bold text-white mb-2 flex items-center gap-3">
                    <i data-lucide="landmark" class="w-6 h-6 text-emerald-400"></i>
                    Vision 2030 Green Capital Center
                </h2>
                <p class="text-sm text-slate-400 max-w-2xl">Use your verified ESG data payload to instantly underwrite and acquire subsidized financing from Saudi banks participating in the National Sustainability Program.</p>
            </div>
            <div class="p-4 rounded-xl glass-panel text-right">
                <p class="text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Your Verified Score</p>
                <div class="text-3xl font-heading font-bold text-white">${metrics.esgScore}<span class="text-sm text-slate-500">/100</span></div>
            </div>
        </div>

        ${isEligible ? `
            <!-- Eligible State -->
            <div class="bg-gradient-to-r from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 rounded-2xl p-8 mb-8 relative overflow-hidden">
                <div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full animate-pulse-slow"></div>
                <div class="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div>
                        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold tracking-widest border border-emerald-500/30 mb-4">
                            <i data-lucide="check-circle" class="w-3 h-3"></i> Pre-Approved Status
                        </span>
                        <h3 class="text-3xl font-heading font-bold text-white mb-2">Subsidized Supply Chain Finance Unlocked</h3>
                        <p class="text-slate-300 text-sm max-w-xl">Because your business maintains an ESG score > 70, you qualify for special green finance rates subsidized by Monsha'at.</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Loan Offer 1 -->
                <div class="glass-panel p-6 rounded-2xl border-emerald-500/20 hover:border-emerald-500/50 transition-all hover-glow group">
                    <div class="flex justify-between items-start mb-6">
                        <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-bold text-blue-900 border-4 border-slate-800">
                            SNB
                        </div>
                        <span class="text-xs font-bold px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">Green Liquidity Line</span>
                    </div>
                    <p class="text-sm text-slate-400 mb-1">Approved Line of Credit</p>
                    <h4 class="text-2xl font-heading font-bold text-white mb-6 whitespace-nowrap">SAR 2,500,000</h4>
                    
                    <div class="space-y-3 mb-8">
                        <div class="flex justify-between text-sm py-2 border-b border-slate-700/50">
                            <span class="text-slate-400">Green Interest Rate</span>
                            <span class="font-bold text-emerald-400 flex items-center gap-1">4.5% <i data-lucide="arrow-down" class="w-3 h-3"></i></span>
                        </div>
                        <div class="flex justify-between text-sm py-2 border-b border-slate-700/50">
                            <span class="text-slate-400">Standard Rate</span>
                            <span class="font-bold text-slate-500 line-through">6.5%</span>
                        </div>
                         <div class="flex justify-between text-sm py-2">
                            <span class="text-slate-400">Approval Time</span>
                            <span class="font-bold text-white">Instant (API)</span>
                        </div>
                    </div>

                    <button class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                        Execute Contract via Nafath <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                    <p class="text-center text-[10px] text-slate-500 mt-3 font-semibold uppercase tracking-wider">No Paperwork Required</p>
                </div>

                 <!-- Loan Offer 2 -->
                 <div class="glass-panel p-6 rounded-2xl border-slate-700/50 hover:border-slate-600 transition-all group">
                    <div class="flex justify-between items-start mb-6">
                        <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-bold text-sky-700 border-4 border-slate-800">
                            ARB
                        </div>
                        <span class="text-xs font-bold px-2 py-1 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">Solar Capex Lease</span>
                    </div>
                    <p class="text-sm text-slate-400 mb-1">Equipment Financing Limit</p>
                    <h4 class="text-2xl font-heading font-bold text-white mb-6 whitespace-nowrap">SAR 850,000</h4>
                    
                    <div class="space-y-3 mb-8">
                        <div class="flex justify-between text-sm py-2 border-b border-slate-700/50">
                            <span class="text-slate-400">Financing Rate</span>
                            <span class="font-bold text-emerald-400">0% (Subsidized)</span>
                        </div>
                        <div class="flex justify-between text-sm py-2 border-b border-slate-700/50">
                            <span class="text-slate-400">Purpose</span>
                            <span class="font-bold text-white">Renewable Assets</span>
                        </div>
                         <div class="flex justify-between text-sm py-2">
                            <span class="text-slate-400">Impact Estimate</span>
                            <span class="font-bold text-emerald-400">-40 tCO2e/yr</span>
                        </div>
                    </div>

                    <button class="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors border border-slate-600 flex items-center justify-center gap-2">
                        View Terms <i data-lucide="external-link" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        ` : `
            <!-- Ineligible State -->
             <div class="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 mb-8">
                <div class="flex items-start gap-4">
                    <div class="p-3 bg-red-500/20 rounded-xl text-red-400 shrink-0">
                        <i data-lucide="lock" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-heading font-bold text-white mb-2">Green Finance Locked</h3>
                        <p class="text-slate-300 text-sm max-w-2xl mb-4">Your current ESG Score of <strong>${metrics.esgScore}</strong> is below the Monsha'at threshold (70) required for subsidized capital. Lenders require a lower carbon footprint profile.</p>
                        <button class="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white hover:bg-slate-700 transition-colors">View Decarbonization Action Plan</button>
                    </div>
                </div>
            </div>
        `}
    `;
    lucide.createIcons();
}

// --- Helpers ---

function getIconForCategory(cat) {
    const map = {
        'electricity': 'zap',
        'fuel': 'fuel',
        'raw_materials': 'box',
        'logistics': 'truck',
        'software': 'monitor-smartphone'
    };
    return map[cat] || 'receipt';
}

function getScopeColor(scope) {
    const map = {
        1: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        2: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        3: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    };
    return map[scope];
}

function initChart() {
    const ctx = document.getElementById('emissionsChart');
    if (!ctx) return;

    // Destroy existing chart if it exists to prevent overlap during re-renders
    if (window.myChartConfig) window.myChartConfig.destroy();

    window.myChartConfig = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Actual Emissions (tCO2e)',
                data: [42, 38, 35, 31],
                borderColor: '#10b981', // emerald-500
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#1e293b',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'SME Baseline',
                data: [40, 40, 40, 40],
                borderColor: '#475569', // slate-600
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // hidden for cleaner UI
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return context.parsed.y + ' tCO2e';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 10, family: 'Inter' }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 10, family: 'Inter' }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
}
