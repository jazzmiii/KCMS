import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import recruitmentService from '../../services/recruitmentService';
import '../../styles/Recruitments.css';

const RecruitmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recruitment, setRecruitment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({
    whyJoin: '',
    skills: '',
    experience: '',
    customAnswers: {},
  });

  useEffect(() => {
    fetchRecruitmentDetails();
  }, [id]);

  const fetchRecruitmentDetails = async () => {
    try {
      const response = await recruitmentService.getById(id);
      setRecruitment(response.data.recruitment);
    } catch (error) {
      console.error('Error fetching recruitment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setApplicationData({
      ...applicationData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCustomAnswerChange = (questionId, value) => {
    setApplicationData({
      ...applicationData,
      customAnswers: {
        ...applicationData.customAnswers,
        [questionId]: value,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApplying(true);

    try {
      await recruitmentService.apply(id, applicationData);
      alert('Application submitted successfully!');
      navigate('/recruitments');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading recruitment details...</p>
        </div>
      </Layout>
    );
  }

  if (!recruitment) {
    return (
      <Layout>
        <div className="error-container">
          <h2>Recruitment not found</h2>
          <button onClick={() => navigate('/recruitments')} className="btn btn-primary">
            Back to Recruitments
          </button>
        </div>
      </Layout>
    );
  }

  const isOpen = recruitment.status === 'open' || recruitment.status === 'closing_soon';
  const canManage = user?.clubRoles?.some(cr => 
    cr.clubId === recruitment.clubId?._id && 
    (cr.roles.includes('president') || cr.roles.includes('core'))
  );

  return (
    <Layout>
      <div className="recruitment-detail-page">
        <div className="recruitment-detail-header">
          <div>
            <h1>{recruitment.title}</h1>
            <p className="club-name-large">{recruitment.clubId?.name || 'Unknown Club'}</p>
          </div>
          <span className={`badge badge-lg badge-${
            recruitment.status === 'open' ? 'success' : 
            recruitment.status === 'closing_soon' ? 'warning' : 'error'
          }`}>
            {recruitment.status}
          </span>
        </div>

        <div className="recruitment-detail-content">
          <div className="recruitment-info-section">
            <div className="info-card">
              <h3>About This Recruitment</h3>
              <p>{recruitment.description}</p>
            </div>

            <div className="info-card">
              <h3>Details</h3>
              <div className="detail-row">
                <span className="detail-label">Start Date:</span>
                <span>{new Date(recruitment.startDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">End Date:</span>
                <span>{new Date(recruitment.endDate).toLocaleDateString()}</span>
              </div>
              {recruitment.positions && (
                <div className="detail-row">
                  <span className="detail-label">Positions Available:</span>
                  <span>{recruitment.positions}</span>
                </div>
              )}
              {recruitment.eligibility && (
                <div className="detail-row">
                  <span className="detail-label">Eligibility:</span>
                  <span>{recruitment.eligibility}</span>
                </div>
              )}
            </div>

            {canManage && (
              <div className="info-card">
                <h3>Manage Recruitment</h3>
                <div className="management-actions">
                  <button 
                    onClick={() => navigate(`/recruitments/${id}/applications`)}
                    className="btn btn-primary"
                  >
                    View Applications
                  </button>
                </div>
              </div>
            )}
          </div>

          {isOpen && !canManage && (
            <div className="application-form-section">
              <h2>Apply Now</h2>
              <form onSubmit={handleSubmit} className="application-form">
                <div className="form-group">
                  <label htmlFor="whyJoin">Why do you want to join this club? *</label>
                  <textarea
                    id="whyJoin"
                    name="whyJoin"
                    value={applicationData.whyJoin}
                    onChange={handleChange}
                    placeholder="Tell us why you're interested (100-300 words)"
                    rows="5"
                    minLength="100"
                    maxLength="300"
                    required
                  />
                  <small className="form-hint">
                    {applicationData.whyJoin.length}/300 characters
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="skills">Relevant Skills *</label>
                  <textarea
                    id="skills"
                    name="skills"
                    value={applicationData.skills}
                    onChange={handleChange}
                    placeholder="List your relevant skills"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="experience">Previous Experience</label>
                  <textarea
                    id="experience"
                    name="experience"
                    value={applicationData.experience}
                    onChange={handleChange}
                    placeholder="Describe any relevant experience"
                    rows="3"
                  />
                </div>

                {recruitment.customQuestions && recruitment.customQuestions.length > 0 && (
                  <div className="custom-questions">
                    <h3>Additional Questions</h3>
                    {recruitment.customQuestions.map((question, index) => (
                      <div key={index} className="form-group">
                        <label>{question}</label>
                        <textarea
                          value={applicationData.customAnswers[index] || ''}
                          onChange={(e) => handleCustomAnswerChange(index, e.target.value)}
                          placeholder="Your answer"
                          rows="3"
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => navigate('/recruitments')}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={applying}>
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!isOpen && !canManage && (
            <div className="info-card">
              <h3>Applications Closed</h3>
              <p>This recruitment is no longer accepting applications.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RecruitmentDetailPage;
