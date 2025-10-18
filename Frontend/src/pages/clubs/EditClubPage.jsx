import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import clubService from '../../services/clubService';
import userService from '../../services/userService';
import '../../styles/Forms.css';

const EditClubPage = () => {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    vision: '',
    mission: '',
    coordinator: '', // Admin-only field
    socialLinks: {
      website: '',
      instagram: '',
      twitter: '',
      linkedin: '',
    },
  });
  
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [coordinators, setCoordinators] = useState([]);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);

  const categories = ['technical', 'cultural', 'sports', 'arts', 'social'];

  useEffect(() => {
    fetchClubData();
    if (user?.roles?.global === 'admin') {
      fetchCoordinators();
    }
  }, [clubId]);

  const fetchClubData = async () => {
    try {
      const response = await clubService.getClub(clubId);
      const clubData = response.data.club;
      setClub(clubData);
      
      // Pre-populate form
      setFormData({
        name: clubData.name || '',
        category: clubData.category || '',
        description: clubData.description || '',
        vision: clubData.vision || '',
        mission: clubData.mission || '',
        coordinator: clubData.coordinator?._id || clubData.coordinator || '',
        socialLinks: {
          website: clubData.socialLinks?.website || '',
          instagram: clubData.socialLinks?.instagram || '',
          twitter: clubData.socialLinks?.twitter || '',
          linkedin: clubData.socialLinks?.linkedin || '',
        },
      });
    } catch (err) {
      console.error('Error fetching club:', err);
      setError('Failed to load club data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinators = async () => {
    setLoadingCoordinators(true);
    try {
      const response = await userService.listUsers({ role: 'coordinator', limit: 100 });
      setCoordinators(response.data?.users || []);
    } catch (err) {
      console.error('Error fetching coordinators:', err);
    } finally {
      setLoadingCoordinators(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested socialLinks
    if (name.startsWith('social_')) {
      const socialField = name.replace('social_', '');
      setFormData({
        ...formData,
        socialLinks: {
          ...formData.socialLinks,
          [socialField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    setError('');
    setSuccess('');
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Banner file size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Banner must be a JPEG, PNG, or WebP image');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleBannerUpload = async () => {
    if (!bannerFile) return;
    
    setUploadingBanner(true);
    setError('');
    setSuccess('');
    
    try {
      await clubService.uploadBanner(clubId, bannerFile);
      setSuccess('✅ Banner uploaded successfully!');
      setBannerFile(null);
      setBannerPreview(null);
      // Refresh club data to show new banner
      await fetchClubData();
    } catch (err) {
      console.error('Banner upload error:', err);
      setError(err.response?.data?.message || '❌ Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await clubService.updateSettings(clubId, formData);
      
      // ✅ Protected fields (President changes require coordinator approval):
      // - name, category, logoUrl (banner is uploaded separately)
      // Note: Coordinator can ONLY be changed by admin (no approval needed)
      const protectedFields = ['name', 'category'];
      const hasProtectedChanges = protectedFields.some(
        field => formData[field] !== club[field]
      );

      if (hasProtectedChanges) {
        setSuccess('⏳ Changes submitted for coordinator approval');
      } else {
        setSuccess('✅ Club updated successfully!');
      }
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/clubs/${clubId}`);
      }, 2000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || 'Failed to update club. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Use backend-provided permission flag (SINGLE SOURCE OF TRUTH)
  const canEdit = club?.canEdit || false;

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading club data...</p>
        </div>
      </Layout>
    );
  }

  if (!club) {
    return (
      <Layout>
        <div className="error-container">
          <h2>Club not found</h2>
          <Link to="/clubs" className="btn btn-primary">Back to Clubs</Link>
        </div>
      </Layout>
    );
  }

  if (!canEdit) {
    return (
      <Layout>
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>You don't have permission to edit this club.</p>
          <Link to={`/clubs/${clubId}`} className="btn btn-primary">Back to Club</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="form-page">
        <div className="form-container">
          <div className="form-header">
            <h1>Edit Club: {club.name}</h1>
            <p>Update club information and settings</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Info Alert */}
          <div className="alert alert-info">
            <strong>Note for Sr Club Heads:</strong> Changes to club name, category, and logo/banner require coordinator approval.
            Other changes will be applied immediately.
            {user?.roles?.global === 'admin' && (
              <>
                <br />
                <strong>Admin Note:</strong> You can change the coordinator assignment. This does not require approval.
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="form">
            {/* Banner Upload Section */}
            <h3>🇫 Banner Image</h3>
            <div className="form-group">
              <label>
                Upload Club Banner
                {user?.roles?.global !== 'admin' && (
                  <span className="label-badge">Requires Approval</span>
                )}
              </label>
              {club?.bannerUrl && !bannerPreview && (
                <div className="current-banner">
                  <p><strong>Current Banner:</strong></p>
                  <img src={club.bannerUrl} alt="Current banner" style={{ maxWidth: '100%', height: 'auto', marginBottom: '1rem' }} />
                </div>
              )}
              {bannerPreview && (
                <div className="banner-preview">
                  <p><strong>New Banner Preview:</strong></p>
                  <img src={bannerPreview} alt="Banner preview" style={{ maxWidth: '100%', height: 'auto', marginBottom: '1rem' }} />
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleBannerChange}
                className="file-input"
              />
              <small>Max size: 5MB. Formats: JPEG, PNG, WebP</small>
              {bannerFile && (
                <button
                  type="button"
                  onClick={handleBannerUpload}
                  className="btn btn-success"
                  disabled={uploadingBanner}
                  style={{ marginTop: '1rem' }}
                >
                  {uploadingBanner ? 'Uploading...' : '⬆️ Upload Banner'}
                </button>
              )}
            </div>

            {/* Basic Information */}
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">
                Club Name * 
                <span className="label-badge">Requires Approval</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter club name"
                required
                minLength={3}
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">
                Category * 
                <span className="label-badge">Requires Approval</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Coordinator Field - Admin Only */}
            {user?.roles?.global === 'admin' && (
              <div className="form-group">
                <label htmlFor="coordinator">
                  Faculty Coordinator * 
                  <span className="label-badge" style={{ background: '#10b981' }}>Admin Only</span>
                </label>
                <select
                  id="coordinator"
                  name="coordinator"
                  value={formData.coordinator}
                  onChange={handleChange}
                  required
                  disabled={loadingCoordinators}
                >
                  <option value="">
                    {loadingCoordinators ? 'Loading coordinators...' : '-- Select Faculty Coordinator --'}
                  </option>
                  {coordinators.map((coord) => (
                    <option key={coord._id} value={coord._id}>
                      {coord.profile?.name || 'No Name'} ({coord.email})
                    </option>
                  ))}
                </select>
                <small>Only admins can change the coordinator assignment. Current: {club?.coordinator?.profile?.name || club?.coordinator?.email || 'Not set'}</small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the club (50-500 characters)"
                required
                minLength={50}
                maxLength={500}
                rows={4}
              />
              <small>{formData.description.length}/500 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="vision">Vision</label>
              <textarea
                id="vision"
                name="vision"
                value={formData.vision}
                onChange={handleChange}
                placeholder="Club vision statement"
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mission">Mission</label>
              <textarea
                id="mission"
                name="mission"
                value={formData.mission}
                onChange={handleChange}
                placeholder="Club mission statement"
                maxLength={500}
                rows={3}
              />
            </div>

            {/* Social Links */}
            <h3>Social Media Links</h3>

            <div className="form-group">
              <label htmlFor="social_website">Website</label>
              <input
                type="url"
                id="social_website"
                name="social_website"
                value={formData.socialLinks.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="social_instagram">Instagram</label>
              <input
                type="url"
                id="social_instagram"
                name="social_instagram"
                value={formData.socialLinks.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/clubname"
              />
            </div>

            <div className="form-group">
              <label htmlFor="social_twitter">Twitter</label>
              <input
                type="url"
                id="social_twitter"
                name="social_twitter"
                value={formData.socialLinks.twitter}
                onChange={handleChange}
                placeholder="https://twitter.com/clubname"
              />
            </div>

            <div className="form-group">
              <label htmlFor="social_linkedin">LinkedIn</label>
              <input
                type="url"
                id="social_linkedin"
                name="social_linkedin"
                value={formData.socialLinks.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/clubname"
              />
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/clubs/${clubId}`)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditClubPage;
