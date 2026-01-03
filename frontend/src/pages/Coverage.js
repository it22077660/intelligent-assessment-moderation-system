/**
 * Coverage Analysis Page Component
 * Displays learning outcome coverage analysis results
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Badge, Form } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { coverageAPI } from '../utils/api';
import ModuleSelector from '../components/ModuleSelector';
import { getPersistedModuleId, setPersistedModuleId } from '../utils/moduleStorage';

function Coverage() {
  const [selectedModuleId, setSelectedModuleId] = useState(() => {
    // Load persisted module on initial render
    return getPersistedModuleId() || '';
  });
  const [coverageData, setCoverageData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAnalysisTag, setSelectedAnalysisTag] = useState(null); // null = default/untagged
  const [analysisTags, setAnalysisTags] = useState([]);

  const COLORS = ['#28a745', '#ffc107', '#dc3545'];

  // Handle module change and persist it
  const handleModuleChange = (moduleId) => {
    setSelectedModuleId(moduleId);
    setPersistedModuleId(moduleId);
  };

  const loadAnalysisTags = useCallback(async () => {
    if (!selectedModuleId) return;

    try {
      const response = await coverageAPI.getAnalysisTags(selectedModuleId);
      if (response.data && response.data.success) {
        setAnalysisTags(response.data.tags || []);
      }
    } catch (error) {
      console.error('Error loading analysis tags:', error);
    }
  }, [selectedModuleId]);

  const loadCoverage = useCallback(async () => {
    if (!selectedModuleId) return;

    try {
      setLoading(true);
      setError('');
      const response = await coverageAPI.getByModule(selectedModuleId, selectedAnalysisTag);
      console.log('Coverage API response:', response.data); // Debug log
      // Axios automatically unwraps response.data, so response.data is the actual response object
      if (response.data && response.data.success !== false) {
        setCoverageData(response.data);
      } else {
        setCoverageData(null);
        if (response.data && response.data.message) {
          setError(response.data.message);
        }
      }
    } catch (error) {
      console.error('Error loading coverage:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load coverage data';
      setError(errorMessage);
      setCoverageData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedModuleId, selectedAnalysisTag]);

  const loadStats = useCallback(async () => {
    if (!selectedModuleId) return;

    try {
      const response = await coverageAPI.getStats(selectedModuleId, selectedAnalysisTag);
      console.log('Stats API response:', response.data); // Debug log
      if (response.data && response.data.success) {
        setStats(response.data.stats);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(null);
    }
  }, [selectedModuleId, selectedAnalysisTag]);

  useEffect(() => {
    if (selectedModuleId) {
      loadAnalysisTags();
    } else {
      setCoverageData(null);
      setStats(null);
      setAnalysisTags([]);
    }
  }, [selectedModuleId, loadAnalysisTags]);

  useEffect(() => {
    if (selectedModuleId) {
      loadCoverage();
      loadStats();
    }
  }, [selectedAnalysisTag, selectedModuleId, loadCoverage, loadStats]);

  const handleAnalyze = async () => {
    if (!selectedModuleId) {
      setError('Please select a module first');
      return;
    }

    setAnalyzing(true);
    setError('');
    setSuccess('');

    try {
      const response = await coverageAPI.analyze(selectedModuleId);
      setSuccess(`Analysis completed! Analyzed ${response.data.totalLOs} learning outcomes.`);
      loadAnalysisTags();
      loadCoverage();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Make sure the module has questions.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Covered':
        return 'success';
      case 'Partially Covered':
        return 'warning';
      case 'Not Covered':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Sort chart data by LO ID to ensure correct order
  const chartData = coverageData?.results
    ? [...coverageData.results]
        .sort((a, b) => {
          // Extract numbers from LO IDs for proper numerical sorting
          const aNum = parseInt(a.loId.replace(/\D/g, '')) || 0;
          const bNum = parseInt(b.loId.replace(/\D/g, '')) || 0;
          if (aNum !== bNum) return aNum - bNum;
          // If numbers are equal, sort alphabetically
          return a.loId.localeCompare(b.loId);
        })
        .map(result => ({
          name: result.loId,
          coverage: result.coveragePercentage
        }))
    : [];

  const pieData = stats ? [
    { name: 'Covered', value: stats.covered },
    { name: 'Partially Covered', value: stats.partiallyCovered },
    { name: 'Not Covered', value: stats.notCovered }
  ] : [];

  return (
    <Container className="mt-4 fade-in">
      <div className="page-header">
        <h1>Coverage Analysis</h1>
        <p className="text-muted mb-0">Analyze learning outcome coverage for your modules</p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Card className="academic-card mb-4">
        <Card.Body>
          <ModuleSelector
            selectedModuleId={selectedModuleId}
            onModuleChange={handleModuleChange}
          />
          {selectedModuleId && (
            <div className="mt-3 d-flex gap-2 flex-wrap align-items-center">
              {analysisTags.length > 0 && (
                <Form.Select
                  size="sm"
                  style={{ width: 'auto', minWidth: '200px' }}
                  value={selectedAnalysisTag || ''}
                  onChange={(e) => setSelectedAnalysisTag(e.target.value || null)}
                >
                  <option value="">Default Analysis (All Questions)</option>
                  {analysisTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </Form.Select>
              )}
              <Button
                variant="primary"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? 'Analyzing...' : '🔍 Run Coverage Analysis (All Questions)'}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {stats && (
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className="academic-card stat-card info text-center h-100">
              <Card.Body>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
                <h2 style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#17a2b8' }}>
                  {stats.totalLOs}
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                  Total LOs
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="academic-card stat-card success text-center h-100">
              <Card.Body>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                <h2 style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#28a745' }}>
                  {stats.covered}
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                  Covered
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="academic-card stat-card warning text-center h-100">
              <Card.Body>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
                <h2 style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#ffc107' }}>
                  {stats.partiallyCovered}
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                  Partially Covered
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="academic-card stat-card danger text-center h-100">
              <Card.Body>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>❌</div>
                <h2 style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#dc3545' }}>
                  {stats.notCovered}
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                  Not Covered
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {stats && (
        <Row className="mb-4">
          <Col md={6}>
            <Card className="academic-card">
              <Card.Header>
                <strong>Coverage Distribution</strong>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="academic-card">
              <Card.Header>
                <strong>Average Coverage: {stats.averageCoverage}%</strong>
              </Card.Header>
              <Card.Body>
                <div className="progress" style={{ height: '30px' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ 
                      width: `${stats.averageCoverage}%`,
                      backgroundColor: stats.averageCoverage >= 70 ? '#28a745' : 
                                     stats.averageCoverage >= 30 ? '#ffc107' : '#dc3545'
                    }}
                    aria-valuenow={stats.averageCoverage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {stats.averageCoverage}%
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading coverage data...</p>
        </div>
      ) : coverageData && coverageData.results && coverageData.results.length > 0 ? (
        <>
          <Card className="academic-card mb-4">
            <Card.Header>
              <strong>Coverage by Learning Outcome</strong>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="coverage" fill="#8884d8" name="Coverage %" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>

          <Card className="academic-card">
            <Card.Header>
              <strong>Detailed Results</strong>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>LO ID</th>
                    <th>Description</th>
                    <th>Bloom's Level</th>
                    <th>Coverage %</th>
                    <th>Status</th>
                    <th>Questions Covered</th>
                  </tr>
                </thead>
                <tbody>
                  {coverageData.results.map((result, index) => (
                    <tr key={index}>
                      <td><strong>{result.loId}</strong></td>
                      <td>{result.description}</td>
                      <td>
                        <Badge bg="info">{result.bloomLevel}</Badge>
                      </td>
                      <td>
                        <strong>{result.coveragePercentage}%</strong>
                      </td>
                      <td>
                        <Badge bg={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </td>
                      <td>{result.questionsCoveredCount !== undefined ? result.questionsCoveredCount : (result.questionsCovered?.length || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {coverageData.analyzedQuestions && coverageData.analyzedQuestions.length > 0 && (
            <Card className="academic-card mt-4">
              <Card.Header>
                <strong>Analyzed Questions ({coverageData.questionCount || coverageData.analyzedQuestions.length})</strong>
                {coverageData.analysisTag && (
                  <Badge bg="info" className="ms-2">{coverageData.analysisTag}</Badge>
                )}
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Question</th>
                      <th>Type</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageData.analyzedQuestions.map((question, index) => (
                      <tr key={question._id}>
                        <td>{index + 1}</td>
                        <td>
                          <div style={{ maxWidth: '600px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {question.questionText.substring(0, 150)}
                            {question.questionText.length > 150 && '...'}
                          </div>
                        </td>
                        <td>
                          <Badge bg={question.questionType === 'MCQ' ? 'info' : 'secondary'}>
                            {question.questionType}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={question.source === 'AI' ? 'success' : question.source === 'Uploaded' ? 'warning' : 'primary'}>
                            {question.source}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </>
      ) : selectedModuleId && !loading ? (
        <Card className="academic-card">
          <Card.Body className="text-center">
            <p className="text-muted mb-3">No coverage data found. Run analysis to get started.</p>
            <Button variant="primary" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? 'Analyzing...' : '🔍 Run Coverage Analysis'}
            </Button>
          </Card.Body>
        </Card>
      ) : null}
    </Container>
  );
}

export default Coverage;

