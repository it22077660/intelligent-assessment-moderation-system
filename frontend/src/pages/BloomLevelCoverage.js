/**
 * Bloom's Level Coverage Analysis Page Component
 * Displays Bloom's taxonomy level coverage analysis results
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Alert, Table, Badge, Form } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { coverageAPI } from '../utils/api';
import ModuleSelector from '../components/ModuleSelector';
import { getPersistedModuleId, setPersistedModuleId } from '../utils/moduleStorage';

function BloomLevelCoverage() {
  const [selectedModuleId, setSelectedModuleId] = useState(() => {
    // Load persisted module on initial render
    return getPersistedModuleId() || '';
  });
  const [coverageData, setCoverageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnalysisTag, setSelectedAnalysisTag] = useState(null); // null = default/untagged
  const [analysisTags, setAnalysisTags] = useState([]);

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

  useEffect(() => {
    if (selectedModuleId) {
      loadAnalysisTags();
    } else {
      setCoverageData(null);
      setAnalysisTags([]);
    }
  }, [selectedModuleId, loadAnalysisTags]);

  useEffect(() => {
    if (selectedModuleId) {
      loadCoverage();
    }
  }, [selectedAnalysisTag, selectedModuleId, loadCoverage]);

  // Calculate Bloom's level coverage analysis
  const calculateBloomLevelCoverage = () => {
    if (!coverageData || !coverageData.results) return null;

    const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
    const bloomStats = {};

    // Initialize stats for each Bloom's level
    bloomLevels.forEach(level => {
      bloomStats[level] = {
        count: 0,
        totalCoverage: 0,
        covered: 0,
        partiallyCovered: 0,
        notCovered: 0
      };
    });

    // Calculate statistics for each Bloom's level
    coverageData.results.forEach(result => {
      const level = result.bloomLevel;
      if (bloomStats[level]) {
        bloomStats[level].count++;
        bloomStats[level].totalCoverage += result.coveragePercentage;
        
        if (result.status === 'Covered') {
          bloomStats[level].covered++;
        } else if (result.status === 'Partially Covered') {
          bloomStats[level].partiallyCovered++;
        } else {
          bloomStats[level].notCovered++;
        }
      }
    });

    // Calculate average coverage for each level
    const bloomLevelData = bloomLevels.map(level => {
      const stats = bloomStats[level];
      const avgCoverage = stats.count > 0 ? Math.round(stats.totalCoverage / stats.count) : 0;
      
      return {
        level,
        count: stats.count,
        averageCoverage: avgCoverage,
        covered: stats.covered,
        partiallyCovered: stats.partiallyCovered,
        notCovered: stats.notCovered
      };
    }).filter(item => item.count > 0); // Only show levels that have LOs

    return bloomLevelData;
  };

  const bloomLevelCoverage = calculateBloomLevelCoverage();

  // Prepare chart data
  const chartData = bloomLevelCoverage ? bloomLevelCoverage.map(item => ({
    level: item.level,
    coverage: item.averageCoverage,
    count: item.count
  })) : [];

  return (
    <Container className="mt-4 fade-in">
      <div className="page-header">
        <h1>Bloom's Level Coverage Analysis</h1>
        <p className="text-muted mb-0">Analyze learning outcome coverage by Bloom's taxonomy levels</p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

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
            </div>
          )}
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading Bloom's level coverage data...</p>
        </div>
      ) : bloomLevelCoverage && bloomLevelCoverage.length > 0 ? (
        <>
          <Row className="mb-4">
            <Col>
              <Card className="academic-card">
                <Card.Header>
                  <strong>Average Coverage by Bloom's Level</strong>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="coverage" fill="#8884d8" name="Average Coverage %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <Card className="academic-card">
                <Card.Header>
                  <strong>Bloom's Level Coverage Analysis</strong>
                  {coverageData?.analysisTag && (
                    <Badge bg="info" className="ms-2">{coverageData.analysisTag}</Badge>
                  )}
                </Card.Header>
                <Card.Body>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Bloom's Level</th>
                        <th>Number of LOs</th>
                        <th>Average Coverage %</th>
                        <th>Covered</th>
                        <th>Partially Covered</th>
                        <th>Not Covered</th>
                        <th>Coverage Visualization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bloomLevelCoverage.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <Badge bg="info" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                              {item.level}
                            </Badge>
                          </td>
                          <td><strong>{item.count}</strong></td>
                          <td>
                            <strong>{item.averageCoverage}%</strong>
                          </td>
                          <td>
                            <Badge bg="success">{item.covered}</Badge>
                          </td>
                          <td>
                            <Badge bg="warning">{item.partiallyCovered}</Badge>
                          </td>
                          <td>
                            <Badge bg="danger">{item.notCovered}</Badge>
                          </td>
                          <td>
                            <div className="progress" style={{ height: '25px', minWidth: '150px' }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{ 
                                  width: `${item.averageCoverage}%`,
                                  backgroundColor: item.averageCoverage >= 70 ? '#28a745' : 
                                                   item.averageCoverage >= 30 ? '#ffc107' : '#dc3545'
                                }}
                                aria-valuenow={item.averageCoverage}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              >
                                {item.averageCoverage}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {coverageData?.analyzedQuestions && coverageData.analyzedQuestions.length > 0 && (
            <Card className="academic-card mt-4">
              <Card.Header>
                <strong>Analyzed Questions ({coverageData.questionCount || coverageData.analyzedQuestions.length})</strong>
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
            <p className="text-muted mb-3">
              No Bloom's level coverage data found. 
              <br />
              Please run a coverage analysis first from the Coverage Analysis page.
            </p>
          </Card.Body>
        </Card>
      ) : null}
    </Container>
  );
}

export default BloomLevelCoverage;

