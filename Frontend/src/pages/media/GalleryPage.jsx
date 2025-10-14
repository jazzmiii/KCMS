import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import documentService from '../../services/documentService';
import clubService from '../../services/clubService';
import { useAuth } from '../../context/AuthContext';
import { 
  FaImage, 
  FaUpload, 
  FaDownload, 
  FaTrash,
  FaFolderPlus,
  FaSearch,
  FaTimes
} from 'react-icons/fa';
import '../../styles/Gallery.css';

function GalleryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(searchParams.get('album') || 'all');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadClubId, setUploadClubId] = useState('');
  const [uploadAlbum, setUploadAlbum] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');

  const [clubs, setClubs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (uploadClubId) {
      fetchDocuments();
      fetchAlbums();
    }
  }, [uploadClubId, selectedAlbum, searchQuery, page]);

  const fetchDocuments = async () => {
    if (!uploadClubId) {
      setDocuments([]);
      return;
    }

    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        type: 'image'
      };

      if (selectedAlbum && selectedAlbum !== 'all') {
        params.album = selectedAlbum;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await documentService.list(uploadClubId, params);
      setDocuments(response.data?.items || []);
      setTotalPages(Math.ceil((response.data?.total || 0) / 20));
    } catch (err) {
      console.error('Error fetching documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    if (!uploadClubId) {
      setAlbums([]);
      return;
    }

    try {
      const response = await documentService.getAlbums(uploadClubId);
      setAlbums(response.data || []);
    } catch (err) {
      console.error('Error fetching albums:', err);
      setAlbums([]);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await clubService.listClubs();
      setClubs(response.data?.clubs || []);
    } catch (err) {
      console.error('Error fetching clubs:', err);
      setClubs([]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(files);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    if (!uploadClubId) {
      alert('Please select a club');
      return;
    }

    try {
      setUploading(true);
      
      const metadata = {};
      if (uploadAlbum) metadata.album = uploadAlbum;
      if (uploadDescription) metadata.description = uploadDescription;

      if (uploadFiles.length > 1) {
        await documentService.bulkUpload(uploadClubId, uploadFiles, metadata);
      } else {
        await documentService.upload(uploadClubId, uploadFiles, metadata);
      }

      alert('Files uploaded successfully!');
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadDescription('');
      setUploadAlbum('');
      fetchDocuments();
    } catch (err) {
      console.error('Error uploading files:', err);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName) {
      alert('Please enter album name');
      return;
    }

    if (!uploadClubId) {
      alert('Please select a club first');
      return;
    }

    try {
      await documentService.createAlbum(uploadClubId, {
        name: newAlbumName,
        description: newAlbumDescription
      });

      alert('Album created successfully!');
      setShowAlbumModal(false);
      setNewAlbumName('');
      setNewAlbumDescription('');
      fetchAlbums();
    } catch (err) {
      console.error('Error creating album:', err);
      alert('Failed to create album');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    if (!uploadClubId) return;

    try {
      await documentService.delete(uploadClubId, docId);
      alert('Image deleted successfully!');
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image');
    }
  };

  const handleDownload = async (doc) => {
    if (!uploadClubId) return;

    try {
      const response = await documentService.download(uploadClubId, doc._id);
      documentService.downloadBlob(response.data, doc.filename || 'image.jpg');
    } catch (err) {
      console.error('Error downloading image:', err);
      alert('Failed to download image');
    }
  };

  return (
    <Layout>
      <div className="gallery-page">
        <div className="gallery-header">
          <div className="header-left">
            <FaImage className="page-icon" />
            <h1>Media Gallery</h1>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setShowAlbumModal(true)}>
              <FaFolderPlus /> New Album
            </button>
            <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
              <FaUpload /> Upload Images
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="gallery-filters">
          <div className="club-selector">
            <label>Select Club:</label>
            <select
              value={uploadClubId}
              onChange={(e) => {
                setUploadClubId(e.target.value);
                setSelectedAlbum('all');
                setPage(1);
              }}
            >
              <option value="">-- Select a Club --</option>
              {clubs.map(club => (
                <option key={club._id} value={club._id}>{club.name}</option>
              ))}
            </select>
          </div>

          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!uploadClubId}
            />
          </div>

          <div className="album-filter">
            <select
              value={selectedAlbum}
              onChange={(e) => {
                setSelectedAlbum(e.target.value);
                setPage(1);
              }}
              disabled={!uploadClubId}
            >
              <option value="all">All Albums</option>
              {albums.map(album => (
                <option key={album._id} value={album._id}>
                  {album.name} ({album.count || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gallery Grid */}
        {!uploadClubId ? (
          <div className="empty-state">
            <FaImage className="empty-icon" />
            <h3>Select a Club</h3>
            <p>Please select a club from the dropdown above to view its gallery</p>
          </div>
        ) : loading ? (
          <div className="loading">Loading images...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <FaImage className="empty-icon" />
            <h3>No Images Found</h3>
            <p>Upload some images to get started!</p>
          </div>
        ) : (
          <>
            <div className="gallery-grid">
              {documents.map(doc => (
                <div key={doc._id} className="gallery-item">
                  <div className="image-wrapper" onClick={() => {
                    setSelectedImage(doc);
                    setShowImageModal(true);
                  }}>
                    <img 
                      src={doc.url || doc.cloudinaryUrl} 
                      alt={doc.description || doc.filename}
                    />
                    <div className="image-overlay">
                      <button 
                        className="overlay-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(doc);
                        }}
                      >
                        <FaDownload />
                      </button>
                      <button 
                        className="overlay-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc._id);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="image-info">
                    <p className="image-title">{doc.description || doc.filename}</p>
                    <p className="image-meta">
                      {doc.club?.name || 'Unknown Club'} • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Upload Images</h2>
                <button className="close-btn" onClick={() => setShowUploadModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Club *</label>
                  <select value={uploadClubId} onChange={(e) => setUploadClubId(e.target.value)}>
                    <option value="">-- Select Club --</option>
                    {clubs.map(club => (
                      <option key={club._id} value={club._id}>{club.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Album (Optional)</label>
                  <select value={uploadAlbum} onChange={(e) => setUploadAlbum(e.target.value)}>
                    <option value="">-- No Album --</option>
                    {albums.map(album => (
                      <option key={album._id} value={album._id}>{album.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Select Files * (Max 10 images, 5MB each)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                  />
                  {uploadFiles.length > 0 && (
                    <p className="file-count">{uploadFiles.length} file(s) selected</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleUpload}
                  disabled={uploading || uploadFiles.length === 0}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Album Modal */}
        {showAlbumModal && (
          <div className="modal-overlay" onClick={() => setShowAlbumModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Album</h2>
                <button className="close-btn" onClick={() => setShowAlbumModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Album Name *</label>
                  <input
                    type="text"
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    placeholder="Enter album name"
                  />
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={newAlbumDescription}
                    onChange={(e) => setNewAlbumDescription(e.target.value)}
                    placeholder="Describe this album..."
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAlbumModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreateAlbum}>
                  Create Album
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image View Modal */}
        {showImageModal && selectedImage && (
          <div className="modal-overlay large" onClick={() => setShowImageModal(false)}>
            <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowImageModal(false)}>
                <FaTimes />
              </button>
              <img 
                src={selectedImage.url || selectedImage.cloudinaryUrl} 
                alt={selectedImage.description}
              />
              <div className="image-modal-info">
                <h3>{selectedImage.description || selectedImage.filename}</h3>
                <p>{selectedImage.club?.name} • {new Date(selectedImage.uploadedAt).toLocaleDateString()}</p>
                <div className="image-actions">
                  <button className="btn btn-secondary" onClick={() => handleDownload(selectedImage)}>
                    <FaDownload /> Download
                  </button>
                  <button className="btn btn-danger" onClick={() => {
                    setShowImageModal(false);
                    handleDelete(selectedImage._id);
                  }}>
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default GalleryPage;
