/**
 * Questions Page Component
 * Manages question upload and manual entry
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table, Tabs, Tab, Badge } from 'react-bootstrap';
import { questionAPI, coverageAPI } from '../utils/api';
import ModuleSelector from '../components/ModuleSelector';
import { getPersistedModuleId, setPersistedModuleId } from '../utils/moduleStorage';

function Questions() {
  const [selectedModuleId, setSelectedModuleId] = useState(() => {
    // Load persisted module on initial render
    return getPersistedModuleId() || '';
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    questionText: '',
    questionType: 'Structured',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 10
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All'); // Filter: All, Uploaded, Manual, AI
  const [sortBy, setSortBy] = useState('type'); // Sort: type, date
  const [selectedQuestions, setSelectedQuestions] = useState([]); // Selected question IDs for analysis
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisTag, setAnalysisTag] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showQuestionDetailModal, setShowQuestionDetailModal] = useState(false);
  const [selectedQuestionDetail, setSelectedQuestionDetail] = useState(null);

  // Handle module change and persist it
  const handleModuleChange = (moduleId) => {
    setSelectedModuleId(moduleId);
    setPersistedModuleId(moduleId);
  };

  useEffect(() => {
    if (selectedModuleId) {
      loadQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedModuleId]);

  const loadQuestions = async () => {
    if (!selectedModuleId) return;
    
    try {
      setLoading(true);
      const response = await questionAPI.getByModule(selectedModuleId, {
        sortBy: 'type' // Default sort by type
      });
      setQuestions(response.data.questions || []);
    } catch (error) {
      setError('Failed to load questions');
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedModuleId) {
      setError('Please select a module first');
      return;
    }
    if (!uploadFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await questionAPI.upload(selectedModuleId, uploadFile);
      setSuccess(`Successfully extracted ${response.data.count} questions from file`);
      setUploadFile(null);
      setShowUploadModal(false);
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedModuleId) {
      setError('Please select a module first');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const questionData = {
        moduleId: selectedModuleId,
        questionText: formData.questionText,
        questionType: formData.questionType,
        marks: formData.marks
      };

      if (formData.questionType === 'MCQ') {
        questionData.options = formData.options.filter(opt => opt.trim());
        questionData.correctAnswer = formData.correctAnswer;
      }

      await questionAPI.create(questionData);
      setSuccess('Question created successfully');
      setFormData({
        questionText: '',
        questionType: 'Structured',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 10
      });
      setShowManualModal(false);
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create question');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await questionAPI.delete(id);
        setSuccess('Question deleted successfully');
        setSelectedQuestions(selectedQuestions.filter(qId => qId !== id));
        loadQuestions();
      } catch (err) {
        setError(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleQuestionSelect = (questionId, isSelected) => {
    if (isSelected) {
      setSelectedQuestions([...selectedQuestions, questionId]);
    } else {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    }
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q._id));
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedModuleId) {
      setError('Please select a module first');
      return;
    }

    if (selectedQuestions.length === 0) {
      setError('Please select at least one question');
      return;
    }

    setAnalyzing(true);
    setError('');
    setSuccess('');

    try {
      const tag = analysisTag.trim() || `Analysis-${new Date().toISOString().slice(0, 16)}`;
      const response = await coverageAPI.analyze(selectedModuleId, {
        questionIds: selectedQuestions,
        analysisTag: tag
      });
      
      setSuccess(`Analysis completed! Analyzed ${response.data.totalQuestions} questions. Tag: ${tag}`);
      setShowAnalysisModal(false);
      setAnalysisTag('');
      // Optionally navigate to coverage page or keep selection
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // Filter and sort questions
  const getFilteredAndSortedQuestions = () => {
    let filtered = questions;

    // Apply source filter
    if (sourceFilter !== 'All') {
      filtered = filtered.filter(q => q.source === sourceFilter);
    }

    // Apply sorting
    if (sortBy === 'type') {
      // Sort by question type: MCQ first, then Structured
      filtered = [...filtered].sort((a, b) => {
        if (a.questionType === b.questionType) {
          // If same type, sort by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.questionType === 'MCQ' ? -1 : 1;
      });
    } else if (sortBy === 'date') {
      // Sort by creation date (newest first)
      filtered = [...filtered].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    return filtered;
  };

  const filteredQuestions = getFilteredAndSortedQuestions();

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>Question Management</h1>
          <p className="text-muted">Upload question papers or manually add questions</p>
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
          {selectedModuleId && (
            <div className="mt-3">
              <Button
                variant="primary"
                className="me-2"
                onClick={() => setShowUploadModal(true)}
              >
                📄 Upload Question Paper
              </Button>
              <Button
                variant="success"
                onClick={() => setShowManualModal(true)}
              >
                ✏️ Add Manual Question
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {selectedModuleId && (
        <Card className="academic-card">
          <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
            <strong>Questions ({filteredQuestions.length} of {questions.length})</strong>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              {/* Source Filter */}
              <Form.Select
                size="sm"
                style={{ width: 'auto', minWidth: '140px' }}
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="All">All Sources</option>
                <option value="Uploaded">Uploaded</option>
                <option value="Manual">Manual</option>
                <option value="AI">AI Generated</option>
              </Form.Select>
              {/* Sort By */}
              <Form.Select
                size="sm"
                style={{ width: 'auto', minWidth: '140px' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="type">Sort by Type</option>
                <option value="date">Sort by Date</option>
              </Form.Select>
            </div>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : questions.length === 0 ? (
              <p className="text-muted text-center">No questions found. Upload or add questions to get started.</p>
            ) : filteredQuestions.length === 0 ? (
              <p className="text-muted text-center">No questions match the selected filter.</p>
            ) : (
              <>
                {selectedQuestions.length > 0 && (
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <span className="text-muted">
                      {selectedQuestions.length} question(s) selected
                    </span>
                    <div>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={handleSelectAll}
                      >
                        {selectedQuestions.length === filteredQuestions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowAnalysisModal(true)}
                      >
                        🔍 Analyze Selected ({selectedQuestions.length})
                      </Button>
                    </div>
                  </div>
                )}
                <Table striped bordered hover>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check
                        type="checkbox"
                        checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Question</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((question) => (
                    <tr key={question._id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedQuestions.includes(question._id)}
                          onChange={(e) => handleQuestionSelect(question._id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <div style={{ maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {question.questionText.substring(0, 100)}
                          {question.questionText.length > 100 && '...'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${question.questionType === 'MCQ' ? 'info' : 'secondary'}`}>
                          {question.questionType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${question.source === 'AI' ? 'success' : question.source === 'Uploaded' ? 'warning' : 'primary'}`}>
                          {question.source}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => {
                            setSelectedQuestionDetail(question);
                            setShowQuestionDetailModal(true);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(question._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Question Paper</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpload}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select File (PDF, DOCX, or TXT)</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                required
              />
              <Form.Text className="text-muted">
                Supported formats: PDF, DOCX, TXT (Max 10MB)
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal show={showManualModal} onHide={() => setShowManualModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Manual Question</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleManualSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Question Type *</Form.Label>
              <Form.Select
                value={formData.questionType}
                onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                required
              >
                <option value="Structured">Structured / Essay</option>
                <option value="MCQ">Multiple Choice (MCQ)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Question Text *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                required
                placeholder="Enter the question..."
              />
            </Form.Group>

            {formData.questionType === 'MCQ' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Options *</Form.Label>
                  {formData.options.map((option, index) => (
                    <Form.Control
                      key={index}
                      type="text"
                      className="mb-2"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[index] = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      required
                    />
                  ))}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Correct Answer</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                    placeholder="Enter correct answer"
                  />
                </Form.Group>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Marks</Form.Label>
              <Form.Control
                type="number"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowManualModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Question</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Analysis Modal */}
      <Modal show={showAnalysisModal} onHide={() => setShowAnalysisModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Run Coverage Analysis</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            You are about to analyze <strong>{selectedQuestions.length}</strong> selected question(s).
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Analysis Tag (Optional)</Form.Label>
            <Form.Control
              type="text"
              value={analysisTag}
              onChange={(e) => setAnalysisTag(e.target.value)}
              placeholder="e.g., Midterm Questions, Final Exam, etc."
            />
            <Form.Text className="text-muted">
              Give this analysis a name to identify it later. If left empty, a timestamp will be used.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAnalysisModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRunAnalysis} disabled={analyzing}>
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Question Detail Modal */}
      <Modal 
        show={showQuestionDetailModal} 
        onHide={() => setShowQuestionDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Question Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedQuestionDetail && (
            <>
              <div className="mb-3">
                <strong>Question:</strong>
                <p className="mt-2">{selectedQuestionDetail.questionText}</p>
              </div>

              <div className="mb-3">
                <strong>Type:</strong>{' '}
                <Badge bg={selectedQuestionDetail.questionType === 'MCQ' ? 'info' : 'secondary'}>
                  {selectedQuestionDetail.questionType}
                </Badge>
              </div>

              <div className="mb-3">
                <strong>Source:</strong>{' '}
                <Badge bg={selectedQuestionDetail.source === 'AI' ? 'success' : selectedQuestionDetail.source === 'Uploaded' ? 'warning' : 'primary'}>
                  {selectedQuestionDetail.source}
                </Badge>
              </div>

              {selectedQuestionDetail.marks > 0 && (
                <div className="mb-3">
                  <strong>Marks:</strong> {selectedQuestionDetail.marks}
                </div>
              )}

              {selectedQuestionDetail.questionType === 'MCQ' && (
                <>
                  <hr />
                  <div className="mb-3">
                    <strong>Options:</strong>
                    <div className="mt-2">
                      {selectedQuestionDetail.options && selectedQuestionDetail.options.length > 0 ? (
                        selectedQuestionDetail.options.map((option, index) => (
                          <div 
                            key={index} 
                            className={`p-2 mb-2 rounded ${
                              option === selectedQuestionDetail.correctAnswer 
                                ? 'bg-success text-white' 
                                : 'bg-light'
                            }`}
                          >
                            <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                            {option === selectedQuestionDetail.correctAnswer && (
                              <Badge bg="light" text="dark" className="ms-2">Correct Answer</Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">No options available</p>
                      )}
                    </div>
                  </div>
                  {selectedQuestionDetail.correctAnswer && (
                    <div className="alert alert-success">
                      <strong>Correct Answer:</strong> {selectedQuestionDetail.correctAnswer}
                    </div>
                  )}
                </>
              )}

              {selectedQuestionDetail.questionType === 'Structured' && selectedQuestionDetail.sampleAnswer && (
                <>
                  <hr />
                  <div className="mb-3">
                    <strong>Sample Answer:</strong>
                    <div className="mt-2 p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedQuestionDetail.sampleAnswer}
                    </div>
                  </div>
                </>
              )}

              {selectedQuestionDetail.questionType === 'Structured' && !selectedQuestionDetail.sampleAnswer && (
                <div className="alert alert-info">
                  No sample answer available for this question.
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQuestionDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Questions;

