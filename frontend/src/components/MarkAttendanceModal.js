// src/components/MarkAttendanceModal.js

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Default styling
import toast from 'react-hot-toast';
import { X, Search, User, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';

// --- MOCK API FUNCTIONS ---
// In your real app, these will be actual API calls using 'axios' or 'fetch'.
const mockApi = {
    verifyStudent: async (studentId) => {
        console.log(`Verifying student: ${studentId}`);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        if (studentId === '12345') {
            return { success: true, student: { id: '12345', name: 'John Doe' } };
        }
        return { success: false, message: 'Student not found.' };
    },
    getStudentAttendance: async (studentId, date) => {
        console.log(`Fetching attendance for ${studentId} for month ${date.getMonth() + 1}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        // Return some mock data
        return {
            '2025-10-08': 'present',
            '2025-10-09': 'present',
            '2025-10-10': 'absent',
            '2025-10-15': 'holiday',
        };
    },
    markStudentAttendance: async (studentId, date, status) => {
        console.log(`Marking ${studentId} as ${status} for ${date.toDateString()}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        toast.success(`Marked student as ${status}`);
        return { success: true, date, status };
    }
};
// --- END MOCK API ---


const MarkAttendanceModal = ({ show, onClose, onAttendanceMarked }) => {
    const [step, setStep] = useState(1); // 1: Enter ID, 2: Mark Attendance
    const [studentId, setStudentId] = useState('');
    const [verifiedStudent, setVerifiedStudent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState({});

    useEffect(() => {
        if (verifiedStudent) {
            fetchAttendanceForMonth(currentMonth);
        }
    }, [verifiedStudent, currentMonth]);

    const fetchAttendanceForMonth = async (date) => {
        setIsLoading(true);
        try {
            const data = await mockApi.getStudentAttendance(verifiedStudent.id, date);
            setAttendanceData(data);
        } catch (err) {
            toast.error("Failed to fetch attendance data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyStudent = async (e) => {
        e.preventDefault();
        if (!studentId) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await mockApi.verifyStudent(studentId);
            if (response.success) {
                setVerifiedStudent(response.student);
                setStep(2);
            } else {
                setError(response.message);
                toast.error(response.message);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            toast.error('An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDayClick = async (date) => {
        const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const currentStatus = attendanceData[dateString];

        // Simple toggle for demonstration: Present -> Absent -> Holiday -> (remove)
        let nextStatus;
        if (currentStatus === 'present') nextStatus = 'absent';
        else if (currentStatus === 'absent') nextStatus = 'holiday';
        else if (currentStatus === 'holiday') nextStatus = null; // Clear status
        else nextStatus = 'present';

        // Update UI optimistically
        const updatedData = { ...attendanceData };
        if (nextStatus) {
            updatedData[dateString] = nextStatus;
        } else {
            delete updatedData[dateString];
        }
        setAttendanceData(updatedData);

        // API call
        await mockApi.markStudentAttendance(verifiedStudent.id, date, nextStatus);
        onAttendanceMarked(); // Notify parent to refresh data
    };
    
    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toISOString().split('T')[0];
            const status = attendanceData[dateString];
            if (status) {
                return `attendance-${status}`;
            }
        }
        return null;
    };

    const resetAndClose = () => {
        setStep(1);
        setStudentId('');
        setVerifiedStudent(null);
        setError('');
        setAttendanceData({});
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300">
                <div className="p-6 relative">
                    <button onClick={resetAndClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>

                    {step === 1 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Mark Attendance</h2>
                            <p className="text-gray-500 mb-6">Enter the student's ID to begin.</p>
                            <form onSubmit={handleVerifyStudent}>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        placeholder="Student ID"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                                <button type="submit" disabled={isLoading} className="mt-4 w-full bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center transition">
                                    {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>Find Student <Search size={20} className="ml-2" /></>}
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 2 && verifiedStudent && (
                        <div className="animate-fade-in">
                            <div className="flex items-center mb-4">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                                    <User size={24} />
                                </div>
                                <div className="ml-3">
                                    <h2 className="text-xl font-bold text-gray-800">{verifiedStudent.name}</h2>
                                    <p className="text-gray-500 text-sm">ID: {verifiedStudent.id}</p>
                                </div>
                            </div>
                            
                            <div className="my-calendar-container">
                                <Calendar
                                    onChange={setCurrentMonth}
                                    value={currentMonth}
                                    onClickDay={handleDayClick}
                                    onActiveStartDateChange={({ activeStartDate }) => setCurrentMonth(activeStartDate)}
                                    tileClassName={tileClassName}
                                />
                            </div>

                            <div className="mt-6 flex justify-around text-sm text-gray-600">
                                <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-green-500 mr-2"></span>Present</div>
                                <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-red-500 mr-2"></span>Absent</div>
                                <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-orange-500 mr-2"></span>Holiday</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarkAttendanceModal;