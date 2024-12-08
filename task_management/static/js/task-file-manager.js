class TaskFileManager {
    constructor() {
        this.initializeElements();
        if (this.initialized) {
            this.loadFiles();
        }
    }

    initializeElements() {
        try {
            this.filesList = document.getElementById('filesList');
            this.documentContent = document.getElementById('documentContent');
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing elements:', error);
            this.initialized = false;
        }
    }

    async loadFiles() {
        const taskId = this.getTaskId();
        console.log('Getting files for task:', taskId); // Debug log
        
        try {
            const response = await fetch(`/api/tasks/${taskId}/files/`);
            console.log('Response status:', response.status); // Debug log
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            console.log('Raw response:', text); // Debug log
            
            const files = JSON.parse(text);
            console.log('Parsed files:', files); // Debug log
            
            this.renderFilesList(files);
        } catch (error) {
            console.error('Error loading files:', error);
            this.showNotification('Error loading files', 'error');
        }
    }

    renderFilesList(files) {
        console.log('Rendering files:', files); // Debug log
        this.filesList.innerHTML = files.map(file => `
            <div class="file-item" data-file-id="${file.filename}">
                <div class="file-item-name" 
                     onclick="taskFileManager.loadDocument('${file.filename}', '${file.file_type}')">
                    ${file.filename}
                </div>
                <div class="file-actions">
                    <button class="btn-download" onclick="taskFileManager.downloadFile('${file.filename}')">
                        Download
                    </button>
                    <button class="btn-delete" onclick="taskFileManager.showDeleteFileModal('${file.filename}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadDocument(fileId, fileType) {
        const taskId = this.getTaskId();
        try {
            this.documentContent.innerHTML = `
                <div class="loading-indicator">
                    <div class="spinner"></div>
                    <p>Loading document...</p>
                </div>
            `;
    
            console.log(`Loading document: ${fileId} (${fileType})`);  // Debug log
            console.log(`Task ID: ${taskId}`);  // Debug log
    
            document.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-file-id="${fileId}"]`)?.classList.add('active');
    
            const url = `/api/tasks/${taskId}/files/${encodeURIComponent(fileId)}/view/`;
            console.log(`Fetching from URL: ${url}`);  // Debug log
    
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            console.log(`Received blob of type: ${blob.type}`);  // Debug log
            await this.displayDocument(blob, fileType);
        } catch (error) {
            console.error('Document loading error:', error);  // Debug log
            this.documentContent.innerHTML = `
                <div class="error-message">
                    <p>Error loading document</p>
                    <small>${error.message}</small>
                </div>
            `;
            this.showNotification('Error loading document', 'error');
        }
    }

    async displayDocument(blob, fileType) {
        const url = URL.createObjectURL(blob);
        
        if (fileType.toLowerCase() === '.pdf') {
            this.documentContent.innerHTML = `
                <object data="${url}" type="application/pdf" width="100%" height="100%">
                    <iframe src="${url}" width="100%" height="100%">
                        This browser does not support PDFs. 
                        <a href="${url}" download class="download-link" onclick="taskFileManager.handleViewerDownload(event, '${fileType}')">
                            Download PDF
                        </a>
                    </iframe>
                </object>
            `;
        } else if (['.jpg', '.jpeg', '.png'].includes(fileType.toLowerCase())) {
            this.documentContent.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                    <img src="${url}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
            `;
        } else {
            this.documentContent.innerHTML = `
                <div class="file-preview">
                    <p>Preview not available for this file type</p>
                    <a href="${url}" download class="download-link" onclick="taskFileManager.handleViewerDownload(event, '${fileType}')">
                        Download File
                    </a>
                </div>
            `;
        }
    }
    
    async handleViewerDownload(event, fileType) {
        try {
            const taskId = this.getTaskId();
            const fileName = event.target.download || `document${fileType}`;
            
            this.showToastNotification('File downloaded successfully', 'success');
                
            await this.pushNotification(
                `File "${fileId}" downloaded successfully`, 
                taskId
            );
        } catch (error) {
            this.showToastNotification('Error downloading file', 'error');
        }
    }

    async downloadFile(fileId) {
        const taskId = this.getTaskId();
        try {
            const response = await fetch(`/api/tasks/${taskId}/files/${encodeURIComponent(fileId)}/view/`);
            if (!response.ok) {
                throw new Error('Error downloading file');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileId;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showToastNotification('File downloaded successfully', 'success');
            
            await this.pushNotification(
                `File "${fileId}" downloaded successfully`, 
                taskId
            );
        } catch (error) {
            this.showToastNotification('Error downloading file', 'error');
        }
    }
    
    showDeleteFileModal(fileId) {
        this.fileToDelete = fileId;
        const modal = document.getElementById('deleteFileModal');
        modal.classList.add('show');
    
        const closeButtons = modal.querySelectorAll('[data-close-modal]');
        closeButtons.forEach(button => {
            button.onclick = () => this.hideDeleteFileModal();
        });
    
        const confirmButton = modal.querySelector('.confirm-delete');
        confirmButton.onclick = () => this.deleteFile(fileId);
    }
    
    hideDeleteFileModal() {
        document.getElementById('deleteFileModal').classList.remove('show');
    }
    
    async deleteFile(fileId) {
        const taskId = this.getTaskId();
        try {
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            const response = await fetch(`/api/tasks/${taskId}/files/${encodeURIComponent(fileId)}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });
    
            if (!response.ok) {
                throw new Error('Failed to delete file');
            }
    
            this.hideDeleteFileModal();
            
            // Show toast notification
            this.showToastNotification('File deleted successfully', 'success');
            
            // Push to notification panel
            await this.pushNotification(
                `File "${fileId}" has been deleted`,
                taskId
            );
            
            await this.loadFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            this.showToastNotification('Error deleting file', 'error');
        }
    }

    getTaskId() {
        const path = window.location.pathname;
        console.log('Current path:', path); // Debug log
        const matches = path.match(/\/task\/(\d+)/);
        const taskId = matches ? matches[1] : null;
        console.log('Extracted taskId:', taskId); // Debug log
        return taskId;
    }

    showToastNotification(message, type = 'success') {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Create toast content
        const iconSVG = type === 'success' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        
        toast.innerHTML = `
            <div class="toast-icon">${iconSVG}</div>
            <div class="toast-message">${message}</div>
            <div class="toast-close">×</div>
        `;
        
        toastContainer.appendChild(toast);
    
        // Add click handler for close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.onclick = () => {
            toast.style.animation = 'slideOut 0.5s ease-out forwards';
            setTimeout(() => toastContainer.removeChild(toast), 500);
        };
    
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOut 0.5s ease-out forwards';
                setTimeout(() => {
                    if (toast.parentElement) {
                        toastContainer.removeChild(toast);
                    }
                }, 500);
            }
        }, 3000);
    }

    async pushNotification(message, taskId) {
        if (window.notificationManager) {
            await window.notificationManager.addNotification(message, taskId);
        }
    }
    
}

document.addEventListener('DOMContentLoaded', () => {
    window.taskFileManager = new TaskFileManager();
});