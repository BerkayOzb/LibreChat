import React from 'react';

export default function AdminPanelLink() {
  // Bu component artık sadece placeholder, 
  // gerçek yönlendirme useSideNavLinks'te onClick ile yapılacak
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm text-text-secondary">
          Redirecting to Admin Panel...
        </p>
      </div>
    </div>
  );
}