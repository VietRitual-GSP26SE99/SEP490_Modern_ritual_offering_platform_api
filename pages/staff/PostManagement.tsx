import React, { useState } from 'react';
import { logoutComplete } from '../../services/auth';

interface PostManagementProps {
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}

interface Post {
  id: string;
  title: string;
  author: string;
  category: 'tutorial' | 'news' | 'promo' | 'guide';
  status: 'draft' | 'published' | 'archived';
  views: number;
  likes: number;
  createdAt: string;
  thumbnail?: string;
}

const PostManagement: React.FC<PostManagementProps> = ({ onNavigate, onLogout }) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | Post['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'POST-001',
      title: 'Cách chọn mâm cúng Rằm tháng 8 đẹp và ý nghĩa',
      author: 'Admin',
      category: 'guide',
      status: 'published',
      views: 1240,
      likes: 89,
      createdAt: '2025-01-15',
    },
    {
      id: 'POST-002',
      title: 'Khuyến mãi đặc biệt Tết Nguyên Đán 2025',
      author: 'Marketing Team',
      category: 'promo',
      status: 'published',
      views: 3560,
      likes: 245,
      createdAt: '2025-01-20',
    },
    {
      id: 'POST-003',
      title: 'Hướng dẫn đặt hàng trên Modern Ritual',
      author: 'Support Team',
      category: 'tutorial',
      status: 'published',
      views: 890,
      likes: 56,
      createdAt: '2025-01-10',
    },
    {
      id: 'POST-004',
      title: 'Tin tức: Mở rộng khu vực giao hàng',
      author: 'Admin',
      category: 'news',
      status: 'draft',
      views: 0,
      likes: 0,
      createdAt: '2025-02-05',
    },
  ]);

  const stats = [
    { label: 'Tổng bài viết', value: posts.length.toString(), icon: '📝' },
    { label: 'Đã xuất bản', value: posts.filter(p => p.status === 'published').length.toString(), icon: '✅' },
    { label: 'Bản nháp', value: posts.filter(p => p.status === 'draft').length.toString(), icon: '📋' },
    { label: 'Tổng lượt xem', value: posts.reduce((sum, p) => sum + p.views, 0).toLocaleString(), icon: '👁️' },
  ];

  const getCategoryBadge = (category: Post['category']) => {
    const styles = {
      tutorial: 'bg-blue-100 text-blue-800 border-blue-200',
      news: 'bg-purple-100 text-purple-800 border-purple-200',
      promo: 'bg-green-100 text-green-800 border-green-200',
      guide: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    const labels = {
      tutorial: 'Hướng dẫn',
      news: 'Tin tức',
      promo: 'Khuyến mãi',
      guide: 'Cẩm nang',
    };
    return { style: styles[category], label: labels[category] };
  };

  const getStatusBadge = (status: Post['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      published: 'bg-green-100 text-green-800 border-green-200',
      archived: 'bg-red-100 text-red-800 border-red-200',
    };
    const labels = {
      draft: 'Bản nháp',
      published: 'Đã xuất bản',
      archived: 'Lưu trữ',
    };
    return { style: styles[status], label: labels[status] };
  };

  const filteredPosts = posts.filter(post => {
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleDeletePost = (postId: string) => {
    if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const handlePublishPost = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, status: 'published' as Post['status'] } : p));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('staff-dashboard')}
                className="w-10 h-10 flex items-center justify-center border-2 border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-all"
              >
                ←
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xl text-white font-playfair font-bold">M</span>
              </div>
              <div>
                <h1 className="text-xl font-playfair font-bold text-gray-900">Quản lý bài đăng</h1>
                <p className="text-xs text-gray-600">Modern Ritual Staff Panel</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
              >
                ➕ Tạo bài viết mới
              </button>
              <button
                onClick={async () => {
                  console.log('🚪 Logging out...');
                  await logoutComplete();
                }}
                className="px-4 py-2 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-900 hover:text-white transition-all"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{stat.icon}</div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterStatus('published')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'published'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Đã xuất bản
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'draft'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Bản nháp
              </button>
            </div>

            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm kiếm bài viết..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const categoryBadge = getCategoryBadge(post.category);
            const statusBadge = getStatusBadge(post.status);

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryBadge.style}`}>
                    {categoryBadge.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.style}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {post.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <span>✍️ {post.author}</span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>👁️ {post.views}</span>
                    <span>❤️ {post.likes}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {post.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublishPost(post.id);
                        }}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-semibold hover:bg-green-200 transition-all"
                      >
                        Xuất bản
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post.id);
                      }}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-semibold hover:bg-red-200 transition-all"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border-2 border-gray-200 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy bài viết</h3>
            <p className="text-gray-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-3xl w-full border-2 border-gray-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPost.title}</h2>
                <p className="text-gray-600">ID: {selectedPost.id}</p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-500 hover:text-gray-900 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                {(() => {
                  const categoryBadge = getCategoryBadge(selectedPost.category);
                  const statusBadge = getStatusBadge(selectedPost.status);
                  return (
                    <>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryBadge.style}`}>
                        {categoryBadge.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.style}`}>
                        {statusBadge.label}
                      </span>
                    </>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Tác giả</p>
                  <p className="font-semibold text-gray-900">{selectedPost.author}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedPost.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Lượt xem</p>
                  <p className="font-semibold text-gray-900">{selectedPost.views.toLocaleString()}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Lượt thích</p>
                  <p className="font-semibold text-gray-900">{selectedPost.likes.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                ✏️ Chỉnh sửa
              </button>
              <button className="flex-1 py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all">
                👁️ Xem trước
              </button>
              {selectedPost.status === 'draft' && (
                <button 
                  onClick={() => {
                    handlePublishPost(selectedPost.id);
                    setSelectedPost(null);
                  }}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                >
                  ✅ Xuất bản
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {isCreating && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setIsCreating(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-3xl w-full border-2 border-gray-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tạo bài viết mới</h2>
                <p className="text-gray-600">Điền thông tin bài viết</p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-900 text-2xl"
              >
                ×
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề bài viết..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục</label>
                  <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none">
                    <option value="guide">Cẩm nang</option>
                    <option value="tutorial">Hướng dẫn</option>
                    <option value="news">Tin tức</option>
                    <option value="promo">Khuyến mãi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
                  <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none">
                    <option value="draft">Bản nháp</option>
                    <option value="published">Xuất bản</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung</label>
                <textarea
                  rows={8}
                  placeholder="Nhập nội dung bài viết..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                >
                  Tạo bài viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManagement;
