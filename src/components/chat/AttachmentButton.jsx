import { useRef, useState } from 'react';
import { FiPaperclip, FiLoader } from 'react-icons/fi';
import api from '../../api';

const AttachmentButton = ({ onAttach, buttonClass = 'btn-icon', iconClass = 'w-5 h-5' }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/messages/upload', fd);
      onAttach({
        url: res.data.url,
        name: file.name,
        type: file.type || '',
        size: file.size,
      });
    } catch (err) {
      alert(err?.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={buttonClass}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        aria-label="Add attachment"
      >
        {uploading
          ? <FiLoader className={`${iconClass} animate-spin`} />
          : <FiPaperclip className={iconClass} />}
      </button>
      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
    </>
  );
};

export default AttachmentButton;