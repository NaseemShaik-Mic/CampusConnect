import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { Bell, CheckCircle, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = filter === 'unread' ? { isRead: false } : filter === 'read' ? { isRead: true } : {};
      const response = await notificationAPI.getAll(params);
      setNotifications(response.data.notifications);
    } catch (error) {
      toast.error('Error fetching notifications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      toast.error('Error marking notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      toast.error('Error marking all notifications as read');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await notificationAPI.delete(id);
        toast.success('Notification deleted');
        fetchNotifications();
        fetchUnreadCount();
      } catch (error) {
        toast.error('Error deleting notification');
      }
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      assignment: '📚',
      grade: '✅',
      attendance: '📅',
      leave: '📝',
      mentoring: '👥',
      general: '📢'
    };
    return icons[type] || '📢';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'blue',
      medium: 'yellow',
      high: 'red'
    };
    return colors[priority] || 'blue';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with your activities</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition flex items-center shadow-lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Notifications</p>
              <p className="text-3xl font-bold mt-2">{notifications.length}</p>
            </div>
            <Bell className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Unread</p>
              <p className="text-3xl font-bold mt-2">{unreadCount}</p>
            </div>
            <Eye className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Read</p>
              <p className="text-3xl font-bold mt-2">{notifications.length - unreadCount}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'read' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div
              key={notification._id}
              className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition ${
                !notification.isRead ? 'border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="text-3xl mr-4">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{notification.title}</h3>
                      {notification.priority === 'high' && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          High Priority
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      {!notification.isRead && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Mark as read"
                    >
                      <Eye className="w-5 h-5 text-blue-500" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notifications found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;