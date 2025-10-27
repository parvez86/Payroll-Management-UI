import React from 'react';
import { progressTracker } from '../utils/progressTracker';

const ProgressDashboard: React.FC = () => {
  const overall = progressTracker.getOverallProgress();
  const categories = progressTracker.getProgressByCategory();
  const nextTasks = progressTracker.getNextRecommendedTasks();
  const blocked = progressTracker.getBlockedTasks();
  const estimation = progressTracker.getEstimatedCompletion();

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem' }}>🚀 Backend Integration Progress</h1>
        <p style={{ margin: '10px 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
          {overall.percentage}% Complete ({overall.completed}/{overall.total})
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '10px',
          height: '12px',
          margin: '15px 0',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #10B981, #3B82F6)',
            height: '100%',
            width: `${overall.percentage}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Category Progress */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#374151', marginBottom: '20px' }}>📊 Progress by Category</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {categories.map((category, index) => (
            <div key={index} style={{
              background: 'white',
              border: `2px solid ${category.color}`,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '15px' 
              }}>
                <span style={{ fontSize: '2rem', marginRight: '10px' }}>{category.icon}</span>
                <div>
                  <h3 style={{ margin: 0, color: '#1F2937' }}>{category.name}</h3>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
                    {category.completedItems}/{category.totalItems} items
                  </p>
                </div>
              </div>
              <div style={{
                background: '#F3F4F6',
                borderRadius: '8px',
                height: '8px',
                overflow: 'hidden',
                marginBottom: '10px'
              }}>
                <div style={{
                  background: category.color,
                  height: '100%',
                  width: `${category.progress}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: category.color, fontWeight: 'bold' }}>
                  {category.progress}%
                </span>
                <span style={{ fontSize: '1.5rem' }}>
                  {category.progress === 100 ? '✅' : category.progress > 0 ? '🔄' : '⏳'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Tasks */}
      {nextTasks.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#374151', marginBottom: '20px' }}>🎯 Next Recommended Tasks</h2>
          <div style={{ 
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {nextTasks.map((task, index) => (
              <div key={index} style={{
                padding: '15px',
                borderLeft: `4px solid ${task.priority === 'high' ? '#EF4444' : '#F59E0B'}`,
                background: '#F9FAFB',
                marginBottom: index < nextTasks.length - 1 ? '15px' : 0,
                borderRadius: '0 8px 8px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>
                    {task.priority === 'high' ? '🔥' : '⚠️'}
                  </span>
                  <h3 style={{ margin: 0, color: '#1F2937' }}>{task.name}</h3>
                  <span style={{ 
                    marginLeft: 'auto',
                    background: task.priority === 'high' ? '#FEE2E2' : '#FEF3C7',
                    color: task.priority === 'high' ? '#DC2626' : '#D97706',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {task.progress}%
                  </span>
                </div>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
                  {task.description}
                </p>
                {task.estimatedHours && (
                  <p style={{ margin: '5px 0 0', color: '#9CA3AF', fontSize: '0.8rem' }}>
                    ⏱️ Estimated: {task.estimatedHours} hours
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked Tasks */}
      {blocked.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#374151', marginBottom: '20px' }}>🚫 Blocked Tasks</h2>
          <div style={{ 
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '20px'
          }}>
            {blocked.map((task, index) => (
              <div key={index} style={{
                marginBottom: index < blocked.length - 1 ? '15px' : 0
              }}>
                <h3 style={{ margin: '0 0 8px', color: '#DC2626' }}>⛔ {task.name}</h3>
                <div style={{ color: '#7F1D1D', fontSize: '0.9rem' }}>
                  {task.blockers?.map((blocker, i) => (
                    <div key={i} style={{ margin: '4px 0' }}>• {blocker}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estimation */}
      <div style={{ 
        background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#374151', marginBottom: '15px' }}>⏱️ Project Estimation</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginTop: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2rem', color: '#3B82F6' }}>⏳</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937' }}>
              {estimation.remainingHours}h
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Remaining Work</div>
          </div>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2rem', color: '#10B981' }}>📅</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937' }}>
              {estimation.estimatedDate}
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Estimated Completion</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ 
        marginTop: '30px',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#374151', marginBottom: '20px' }}>🚀 Quick Actions</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '15px' 
        }}>
          <button style={{
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}>
            📋 Generate Full Report
          </button>
          <button style={{
            background: '#10B981',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}>
            🧪 Run Integration Tests
          </button>
          <button style={{
            background: '#F59E0B',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}>
            🔄 Switch to Real API
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;