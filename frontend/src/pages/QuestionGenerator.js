/**
 * AI Question Generator Page Component
 * Generates questions based on learning outcomes
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Table, Badge } from 'react-bootstrap';
import { moduleAPI, coverageAPI, aiAPI } from '../utils/api';
import ModuleSelector from '../components/ModuleSelector';
import { getPersistedModuleId, setPersistedModuleId } from '../utils/moduleStorage';

function QuestionGenerator() {
  const [selectedModuleId, setSelectedModuleId] = useState(() => {
    // Load persisted module on initial render
    return getPersistedModuleId() || '';
  });
  const [module, setModule] = useState(null);
  const [coverageData, setCoverageData] = useState(null);
  const [selectedLOs, setSelectedLOs] = useState([]);
  const [formData, setFormData] = useState({
    mcqCount: 2,
    structuredCount: 1
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle module change and persist it
  const handleModuleChange = (moduleId) => {
    setSelectedModuleId(moduleId);
    setPersistedModuleId(moduleId);
  };

  useEffect(() => {
    if (selectedModuleId) {
      loadModule();
      loadCoverage();
    } else {
      setModule(null);
      setCoverageData(null);
      setSelectedLOs([]);
    }
  }, [selectedModuleId]);

  const loadModule = async () => {
    try {
      const response = await moduleAPI.getById(selectedModuleId);
      setModule(response.data.module);
    } catch (error) {
      console.error('Error loading module:', error);
    }
  };

  const loadCoverage = async () => {
    try {
      const response = await coverageAPI.getByModule(selectedModuleId);
      setCoverageData(response.data);
    } catch (error) {
      console.error('Error loading coverage:', error);
    }
  };

  const handleLOSelect = (loId) => {
    if (selectedLOs.includes(loId)) {
      setSelectedLOs(selectedLOs.filter(id => id !== loId));
    } else {
      setSelectedLOs([...selectedLOs, loId]);
    }
  };

  const handleSelectUncovered = () => {
    if (!coverageData || !coverageData.results) return;
    
    const uncovered = coverageData.results
      .filter(result => result.status === 'Not Covered' || result.coveragePercentage < 30)
      .map(result => result.loId);
    
    setSelectedLOs(uncovered);
  };

  const handleGenerate = async () => {
    if (!selectedModuleId) {
      setError('Please select a module first');
      return;
    }

    if (selectedLOs.length === 0) {
      setError('Please select at least one learning outcome');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      // Generate questions for each selected LO
      const results = [];
      for (const loId of selectedLOs) {
        try {
          const response = await aiAPI.generateQuestions({
            moduleId: selectedModuleId,
            loId: loId,
            mcqCount: parseInt(formData.mcqCount),
            structuredCount: parseInt(formData.structuredCount)
          });
          results.push({
            loId,
            success: true,
            ...response.data
          });
        } catch (err) {
          results.push({
            loId,
            success: false,
            error: err.response?.data?.message || 'Generation failed'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      setSuccess(`Successfully generated questions for ${successCount} out of ${selectedLOs.length} learning outcomes`);
      setSelectedLOs([]);
      loadCoverage(); // Reload to see new questions
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
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

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>AI Question Generator</h1>
          <p className="text-muted">Generate questions automatically based on learning outcomes and Bloom's taxonomy</p>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Card className="academic-card mb-4">
        <Card.Body>
          <ModuleSelector
            selectedModuleId={selectedModuleId}
            onModuleChange={handleModuleChange}
          />
        </Card.Body>
      </Card>

      {module && (
        <>
          <Row className="mb-4">
            <Col md={6}>
              <Card className="academic-card">
                <Card.Header>
                  <strong>Generation Settings</strong>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Number of MCQs per LO</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="10"
                      value={formData.mcqCount}
                      onChange={(e) => setFormData({ ...formData, mcqCount: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Number of Structured Questions per LO</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="10"
                      value={formData.structuredCount}
                      onChange={(e) => setFormData({ ...formData, structuredCount: e.target.value })}
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={generating || selectedLOs.length === 0}
                    className="w-100"
                  >
                    {generating ? 'Generating Questions...' : '🤖 Generate Questions'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="academic-card">
                <Card.Header>
                  <strong>Module Information</strong>
                </Card.Header>
                <Card.Body>
                  <p><strong>Code:</strong> {module.moduleCode}</p>
                  <p><strong>Name:</strong> {module.moduleName}</p>
                  <p><strong>Learning Outcomes:</strong> {module.learningOutcomes?.length || 0}</p>
                  {coverageData && (
                    <>
                      <hr />
                      <p><strong>Coverage Status:</strong></p>
                      <ul>
                        <li>Covered: {coverageData.results?.filter(r => r.status === 'Covered').length || 0}</li>
                        <li>Partially Covered: {coverageData.results?.filter(r => r.status === 'Partially Covered').length || 0}</li>
                        <li>Not Covered: {coverageData.results?.filter(r => r.status === 'Not Covered').length || 0}</li>
                      </ul>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="academic-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Select Learning Outcomes</strong>
              {coverageData && (
                <Button variant="outline-primary" size="sm" onClick={handleSelectUncovered}>
                  Select Uncovered LOs
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {module.learningOutcomes && module.learningOutcomes.length > 0 ? (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Select</th>
                      <th>LO ID</th>
                      <th>Description</th>
                      <th>Bloom's Level</th>
                      <th>Coverage Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {module.learningOutcomes.map((lo, index) => {
                      const coverage = coverageData?.results?.find(r => r.loId === lo.loId);
                      return (
                        <tr key={index}>
                          <td className="text-center">
                            <Form.Check
                              type="checkbox"
                              checked={selectedLOs.includes(lo.loId)}
                              onChange={() => handleLOSelect(lo.loId)}
                            />
                          </td>
                          <td><strong>{lo.loId}</strong></td>
                          <td>{lo.description}</td>
                          <td>
                            <Badge bg="info">{lo.bloomLevel}</Badge>
                          </td>
                          <td>
                            {coverage ? (
                              <>
                                <Badge bg={getStatusColor(coverage.status)} className="me-2">
                                  {coverage.status}
                                </Badge>
                                <small className="text-muted">({coverage.coveragePercentage}%)</small>
                              </>
                            ) : (
                              <Badge bg="secondary">Not Analyzed</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center">No learning outcomes found for this module.</p>
              )}
              {selectedLOs.length > 0 && (
                <Alert variant="info" className="mt-3">
                  <strong>{selectedLOs.length}</strong> learning outcome(s) selected for question generation.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
}

export default QuestionGenerator;

