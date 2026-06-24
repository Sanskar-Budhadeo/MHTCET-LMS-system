import React, { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp, Activity, Award, Brain, Loader2, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DifficultChapter {
  chapter: string;
  avgAccuracy: number;
}

interface AiUsagePoint {
  date: string;
  generate_test: number;
  doubt_solve: number;
}

interface TrendPoint {
  date: string;
  stateCutoff: number;
  nationalCutoff: number;
  platformAverage: number;
}

interface BiData {
  totalRevenue: number;
  activeUsers: number;
  retentionRate: number;
  conversionRate: number;
  difficultChapters: DifficultChapter[];
  aiUsageChart: AiUsagePoint[];
  nationalTrends: TrendPoint[];
}

export const ExecutiveDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [biData, setBiData] = useState<BiData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('mht_cet_token');
    fetch('http://localhost:5000/api/executive/bi-data', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch executive BI data');
        return res.json();
      })
      .then(data => {
        setBiData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching BI data:', err);
        setError('Database offline. Rendering platform-wide analytics fallback UI.');
        // Set offline mock data
        setBiData({
          totalRevenue: 974465,
          activeUsers: 3240,
          retentionRate: 94.2,
          conversionRate: 16.5,
          difficultChapters: [
            { chapter: 'Rotational Dynamics', avgAccuracy: 48 },
            { chapter: 'Chemical Kinetics', avgAccuracy: 52 },
            { chapter: 'Vectors', avgAccuracy: 55 },
            { chapter: 'Photosynthesis', avgAccuracy: 61 },
            { chapter: 'Electrostatics', avgAccuracy: 63 }
          ],
          aiUsageChart: [
            { date: '2026-06-20', generate_test: 12, doubt_solve: 28 },
            { date: '2026-06-21', generate_test: 15, doubt_solve: 34 },
            { date: '2026-06-22', generate_test: 22, doubt_solve: 45 },
            { date: '2026-06-23', generate_test: 18, doubt_solve: 50 },
            { date: '2026-06-24', generate_test: 30, doubt_solve: 65 }
          ],
          nationalTrends: [
            { date: '06-20', stateCutoff: 88, nationalCutoff: 85, platformAverage: 71 },
            { date: '06-21', stateCutoff: 88, nationalCutoff: 85, platformAverage: 73 },
            { date: '06-22', stateCutoff: 88, nationalCutoff: 85, platformAverage: 74 },
            { date: '06-23', stateCutoff: 89, nationalCutoff: 86, platformAverage: 76 },
            { date: '06-24', stateCutoff: 89, nationalCutoff: 86, platformAverage: 77 }
          ]
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <Loader2 size={36} className="spinner" style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading Executive Analytics Suite...</span>
      </div>
    );
  }

  const revenue = biData?.totalRevenue || 0;
  const activeUsersCount = biData?.activeUsers || 0;
  const retention = biData?.retentionRate || 92.4;
  const conversion = biData?.conversionRate || 14.5;
  const difficultChapters = biData?.difficultChapters || [];
  const aiUsageData = biData?.aiUsageChart || [];
  const nationalTrends = biData?.nationalTrends || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Statewide Platform Analytics (BI Portal)
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Review high-level corporate statistics, conversion indicators, statewide mock exam challenges, and automated AI Tutor usage trends.
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'var(--warning-bg)',
          border: '1px solid var(--warning)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '0.85rem',
          color: 'var(--warning)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Activity size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Corporate KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* Total Revenue */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(5, 150, 105, 0.08)', color: 'var(--success)', padding: '16px', borderRadius: '12px' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Gross Platform Revenue</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ₹{revenue.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>
              +14.2% Month-over-Month
            </span>
          </div>
        </div>

        {/* Active Enrollments */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--accent)', padding: '16px', borderRadius: '12px' }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Active Enrollments</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {activeUsersCount.toLocaleString()} Students
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Verified active users
            </span>
          </div>
        </div>

        {/* Retention Rate */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(217, 119, 6, 0.08)', color: 'var(--warning)', padding: '16px', borderRadius: '12px' }}>
            <Award size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>User Retention Rate</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {retention}%
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>
              High engagement cohort
            </span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', padding: '16px', borderRadius: '12px' }}>
            <Activity size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Paid Conversion Rate</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {conversion}%
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>
              Free to Pro upgrades
            </span>
          </div>
        </div>

      </div>

      {/* Main Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Statewide Difficult Chapters (Bar Chart) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: 'var(--accent)' }} /> Most Difficult Chapters Statewide
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Chapters with the lowest average mock test accuracies among all students.
            </p>
          </div>

          <div style={{ width: '100%', height: 300 }}>
            {difficultChapters.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultChapters} margin={{ top: 10, right: 30, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="chapter" 
                    stroke="var(--text-muted)" 
                    fontSize={10} 
                    angle={-15} 
                    textAnchor="end" 
                    interval={0}
                  />
                  <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    labelStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
                  />
                  <Bar dataKey="avgAccuracy" name="Average Accuracy (%)" fill="var(--danger)" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '60px 0' }}>
                No chapter scoring data recorded.
              </p>
            )}
          </div>
        </div>

        {/* AI Usage Logs over time (Line Chart) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} style={{ color: 'var(--accent)' }} /> Platform AI Usage Metrics
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Aggregated daily metrics for automated test generation and AI doubt solves.
            </p>
          </div>

          <div style={{ width: '100%', height: 300 }}>
            {aiUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiUsageData} margin={{ top: 10, right: 30, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    labelStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="doubt_solve" name="Doubt Solve Hits" stroke="var(--accent)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="generate_test" name="AI Test Generation" stroke="var(--success)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '60px 0' }}>
                No usage logs recorded in the system.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* National/State Trends (Line Chart) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--accent)' }} /> National & State Cutoff Trends
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Comparing average student scoring index against state top cutoff and national qualifiers criteria.
          </p>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          {nationalTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={nationalTrends} margin={{ top: 10, right: 30, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} domain={[60, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                  labelStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
                />
                <Legend />
                <Line type="monotone" dataKey="stateCutoff" name="State Topper Cutoff (%)" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="nationalCutoff" name="National Qualifier Cutoff (%)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="platformAverage" name="Platform Score Average (%)" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '60px 0' }}>
              No trend data recorded.
            </p>
          )}
        </div>
      </div>

    </div>
  );
};
