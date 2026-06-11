import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import BarChart from './BarChart';
import GaugeChart from './GaugeChart';
import MultiLineChart from './MultiLineChart';

// Vision 2030 originally targeted 40% of adults practising sport or
// physical activity weekly; the gauge measures progress against it.
const ACTIVITY_TARGET_PCT = 40;

interface ActivityPoint {
  year: string;
  total_pct: number;
}

interface InvestmentPoint {
  year: string;
  investment: number;
}

interface OlympicPoint {
  year: string;
  total_athletes: number;
  male_athletes: number;
  female_athletes: number;
}

const Dashboard: React.FC = () => {
  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);
  const [investmentData, setInvestmentData] = useState<InvestmentPoint[]>([]);
  const [olympicData, setOlympicData] = useState<OlympicPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const activityRaw = await d3.csv(`${process.env.PUBLIC_URL}/data/activity_prevalence.csv`);
        const investmentRaw = await d3.csv(`${process.env.PUBLIC_URL}/data/digital_and_investment.csv`);
        const olympicRaw = await d3.csv(`${process.env.PUBLIC_URL}/data/olympic_participation.csv`);

        setActivityData(
          activityRaw
            .map(d => ({ year: d.year as string, total_pct: Number(d.total_pct) }))
            .filter(d => Number.isFinite(d.total_pct)),
        );
        setInvestmentData(
          investmentRaw
            .map(d => ({ year: d.year as string, investment: Number(d.investment_billion) }))
            .filter(d => Number.isFinite(d.investment)),
        );
        setOlympicData(
          olympicRaw.map(d => ({
            year: d.year as string,
            total_athletes: Number(d.total_athletes),
            male_athletes: Number(d.male_athletes),
            female_athletes: Number(d.female_athletes),
          })),
        );
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

  const latestActivity = activityData[activityData.length - 1];
  const firstActivity = activityData[0];

  const olympicMultiLineData = [
    {
      name: 'Total athletes',
      color: '#007bff',
      data: olympicData.map(d => ({ year: d.year, value: d.total_athletes })),
    },
    {
      name: 'Male athletes',
      color: '#28a745',
      data: olympicData.map(d => ({ year: d.year, value: d.male_athletes })),
    },
    {
      name: 'Female athletes',
      color: '#dc3545',
      data: olympicData.map(d => ({ year: d.year, value: d.female_athletes })),
    },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Saudi Arabia Vision 2030 Health & Fitness Dashboard</h1>
        <p className="subtitle">Tracking progress towards a healthier, more active Saudi Arabia</p>
      </header>

      {/* Section 1: General Health Engagement */}
      <section className="dashboard-section">
        <h2>General Health Engagement</h2>
        <p className="section-description">
          Vision 2030 set out to get {ACTIVITY_TARGET_PCT}% of adults physically active every week.
          The latest figure: {latestActivity?.total_pct}% ({latestActivity?.year}).
        </p>
        <div className="chart-container">
          <GaugeChart
            value={latestActivity?.total_pct ?? 0}
            target={ACTIVITY_TARGET_PCT}
            title="Adults active weekly"
            unit="%"
          />
        </div>
        <div className="insights">
          <div className="insight-card success">
            <h4>✅ Target exceeded</h4>
            <p>
              {latestActivity?.total_pct}% of adults met the weekly activity guideline in{' '}
              {latestActivity?.year}, up from {firstActivity?.total_pct}% in {firstActivity?.year}.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Activity Prevalence Trend */}
      <section className="dashboard-section">
        <h2>Activity Prevalence Over Time</h2>
        <div className="chart-container">
          <BarChart
            data={activityData.map(d => ({ label: d.year, value: d.total_pct }))}
            title="% of adults meeting 150+ minutes of weekly activity"
            variant="dumbbells"
          />
        </div>
        <p className="chart-note">
          Each dumbbell ≈ 10 percentage points · hover a column for the exact value
        </p>
      </section>

      {/* Section 3: Investment & Infrastructure */}
      <section className="dashboard-section">
        <h2>Fitness Infrastructure & Investment</h2>
        <p className="section-description">
          $6B invested in sports since 2021 • Gym market ~$1.1B with 7–10% CAGR
        </p>
        <div className="chart-container">
          <BarChart
            data={investmentData.map(d => ({ label: d.year, value: d.investment }))}
            title="Sports & health investment (billions USD)"
            format={v => `$${v}B`}
          />
        </div>
        <p className="chart-note">Compiled from public investment announcements</p>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>$6B</h3>
            <p>Sports investment since 2021</p>
          </div>
          <div className="stat-card">
            <h3>$1.1B</h3>
            <p>Current gym market size</p>
          </div>
          <div className="stat-card">
            <h3>7–10%</h3>
            <p>Annual growth rate (CAGR)</p>
          </div>
        </div>
      </section>

      {/* Section 4: Olympics Participation */}
      <section className="dashboard-section">
        <h2>Olympic Participation & International Representation</h2>
        <p className="section-description">
          Saudi Arabia's Olympic delegations since 1984 — and the arrival of female athletes
        </p>
        <div className="chart-container">
          <MultiLineChart
            data={olympicMultiLineData}
            title="Saudi Olympic athletes by gender (1984–2024)"
            yAxisLabel="Number of athletes"
            annotations={[{ year: '2012', label: 'First Saudi women compete — London 2012' }]}
          />
        </div>
        <div className="insights">
          <div className="insight-card">
            <h4>Women in sports</h4>
            <p>Female athlete registrations up 52% in 2023</p>
            <p>Weekly female activity: 8% (2015) → 19% (2019)</p>
          </div>
          <div className="insight-card">
            <h4>Paris 2024</h4>
            <p>8 athletes total (6 men, 2 women)</p>
            <p>25 national women's teams now active</p>
          </div>
        </div>
      </section>

      {/* Section 5: Vision 2030 Summary */}
      <section className="dashboard-section vision-summary">
        <h2>Vision 2030 Progress Summary</h2>
        <div className="progress-grid">
          <div className="progress-card on-track">
            <h3>Health engagement</h3>
            <div className="status">✅ On track</div>
            <p>
              {latestActivity?.total_pct}% activity rate exceeds the {ACTIVITY_TARGET_PCT}% target
            </p>
          </div>
          <div className="progress-card in-progress">
            <h3>Infrastructure investment</h3>
            <div className="status">🔄 In progress</div>
            <p>$6B invested, facilities expanding</p>
          </div>
          <div className="progress-card needs-attention">
            <h3>Olympic excellence</h3>
            <div className="status">⚠️ Needs focus</div>
            <p>Elite sports development required</p>
          </div>
          <div className="progress-card on-track">
            <h3>Women's participation</h3>
            <div className="status">✅ Strong growth</div>
            <p>52% increase in registrations</p>
          </div>
        </div>
      </section>

      <footer className="sources-footer">
        Sources: GASTAT sport &amp; physical activity surveys, Ministry of Sport announcements,
        IOC participation records. Investment series compiled from public announcements.
      </footer>
    </div>
  );
};

export default Dashboard;
