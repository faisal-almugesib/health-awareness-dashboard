import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import BarChart from './BarChart';
import GaugeChart from './GaugeChart';
import MultiLineChart from './MultiLineChart';

interface DataPoint {
  year: string;
  total_pct: number;
}

interface InvestmentData {
  year: string;
  investment: number;
  gdp_percent: number;
}

interface OlympicData {
  year: string;
  total_athletes: number;
  male_athletes: number;
  female_athletes: number;
}

const Dashboard: React.FC = () => {
  const [activityData, setActivityData] = useState<DataPoint[]>([]);
  const [investmentData, setInvestmentData] = useState<InvestmentData[]>([]);
  const [olympicData, setOlympicData] = useState<OlympicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load activity prevalence data
        const activityRaw = await d3.csv(`${process.env.PUBLIC_URL}/data/activity_prevalence.csv`);
        const activityProcessed: DataPoint[] = activityRaw.map(d => ({
          year: d.year as string,
          total_pct: Number(d.total_pct)
        }));

        // Load investment data
        const investmentRaw = await d3.csv(`${process.env.PUBLIC_URL}/data/digital_and_investment.csv`);
        const investmentProcessed: InvestmentData[] = investmentRaw.map(d => ({
          year: d.year as string,
          investment: Number(d.investment_billion),
          gdp_percent: Number(d.gdp_percent)
        }));

        // Load Olympic data
        const olympicRaw = await d3.csv(`${process.env.PUBLIC_URL}/data/olympic_participation.csv`);
        const olympicProcessed: OlympicData[] = olympicRaw.map(d => ({
          year: d.year as string,
          total_athletes: Number(d.total_athletes),
          male_athletes: Number(d.male_athletes),
          female_athletes: Number(d.female_athletes)
        }));

        setActivityData(activityProcessed);
        setInvestmentData(investmentProcessed);
        setOlympicData(olympicProcessed);
        setLoading(false);
      } catch (err) {
        setError('Error loading data');
        setLoading(false);
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, []);

  if (loading) return <div className="loading">Loading Vision 2030 Health Dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  // Prepare Olympic multi-line data
  const olympicMultiLineData = [
    {
      name: "Total Athletes",
      color: "#007bff",
      data: olympicData.map(d => ({ year: d.year, value: d.total_athletes }))
    },
    {
      name: "Male Athletes",
      color: "#28a745",
      data: olympicData.map(d => ({ year: d.year, value: d.male_athletes }))
    },
    {
      name: "Female Athletes",
      color: "#dc3545",
      data: olympicData.map(d => ({ year: d.year, value: d.female_athletes }))
    }
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🇸🇦 Saudi Arabia Vision 2030 Health & Fitness Dashboard</h1>
        <p className="subtitle">Tracking progress towards a healthier, more active Saudi Arabia</p>
      </header>

      {/* Section 1: General Health Engagement */}
      <section className="dashboard-section">
        <h2>🎯 General Health Engagement</h2>
        <p className="section-description">
          Vision 2030 Target: 40-50% weekly activity by 2030. Current progress shows we're on track!
        </p>
        <div className="chart-container">
          <GaugeChart 
            value={48} 
            target={45} 
            title="Adults Meeting Activity Guidelines"
            unit="%" 
          />
        </div>
        <div className="insights">
          <div className="insight-card success">
            <h4>✅ Target Exceeded</h4>
            <p>Current 48% activity rate exceeds the Vision 2030 target range</p>
          </div>
        </div>
      </section>

      {/* Section 2: Activity Prevalence Trend */}
      <section className="dashboard-section">
        <h2>📈 Activity Prevalence Over Time</h2>
        <div className="chart-container">
          <BarChart data={activityData} title="% of Adults Meeting 150+ Minutes Weekly Activity" />
        </div>
      </section>

      {/* Section 3: Investment & Infrastructure */}
      <section className="dashboard-section">
        <h2>🏋️ Fitness Infrastructure & Investment</h2>
        <p className="section-description">
          $6B invested in sports since 2021 • Gym market ~$1.1B with 7-10% CAGR
        </p>
        <div className="chart-container">
          <BarChart 
            data={investmentData.map(d => ({ year: d.year, total_pct: d.investment }))} 
            title="Sports & Health Investment (Billions USD)" 
          />
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>$6B</h3>
            <p>Sports Investment Since 2021</p>
          </div>
          <div className="stat-card">
            <h3>$1.1B</h3>
            <p>Current Gym Market Size</p>
          </div>
          <div className="stat-card">
            <h3>7-10%</h3>
            <p>Annual Growth Rate (CAGR)</p>
          </div>
        </div>
      </section>

      {/* Section 4: Olympics Participation */}
      <section className="dashboard-section">
        <h2>🏅 Olympics Participation & International Representation</h2>
        <p className="section-description">
          Tracking Saudi Arabia's Olympic journey and the rise of female participation
        </p>
        <div className="chart-container">
          <MultiLineChart 
            data={olympicMultiLineData}
            title="Saudi Olympic Athletes by Gender (1984-2024)"
            yAxisLabel="Number of Athletes"
          />
        </div>
        <div className="insights">
          <div className="insight-card">
            <h4>👩‍🏃‍♀️ Women in Sports Progress</h4>
            <p>Female athlete registrations up 52% in 2023</p>
            <p>Weekly female activity: 8% (2015) → 19% (2019)</p>
          </div>
          <div className="insight-card">
            <h4>🎯 2024 Olympics</h4>
            <p>8 athletes total (6 men, 2 women)</p>
            <p>25 national women's teams now active</p>
          </div>
        </div>
      </section>

      {/* Section 5: Vision 2030 Summary */}
      <section className="dashboard-section vision-summary">
        <h2>🚀 Vision 2030 Progress Summary</h2>
        <div className="progress-grid">
          <div className="progress-card on-track">
            <h3>Health Engagement</h3>
            <div className="status">✅ On Track</div>
            <p>48% activity rate exceeds target</p>
          </div>
          <div className="progress-card in-progress">
            <h3>Infrastructure Investment</h3>
            <div className="status">🔄 In Progress</div>
            <p>$6B invested, facilities expanding</p>
          </div>
          <div className="progress-card needs-attention">
            <h3>Olympic Excellence</h3>
            <div className="status">⚠️ Needs Focus</div>
            <p>Elite sports development required</p>
          </div>
          <div className="progress-card on-track">
            <h3>Women's Participation</h3>
            <div className="status">✅ Strong Growth</div>
            <p>52% increase in registrations</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard; 