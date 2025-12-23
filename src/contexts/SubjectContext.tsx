"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Types & Constants ---

export type SubjectId =
    | 'MATH'
    | 'LITERATURE'
    | 'ENGLISH'
    | 'PHYSICS'
    | 'CHEMISTRY'
    | 'BIOLOGY'
    | 'HISTORY'
    | 'GEOGRAPHY'
    | 'CIVIC_EDU'
    | 'COMPUTER'
    | 'OTHER';

export interface SubjectMetadata {
    id: SubjectId;
    name: string;
    icon: string;
    color: string;
    description: string;
    features: {
        mathHelper?: boolean;
        spellCheck?: boolean;
        audioSupport?: boolean;
        timeline?: boolean;
        map?: boolean;
        codeEditor?: boolean;
    };
}

export const SUBJECTS_DATA: Record<SubjectId, SubjectMetadata> = {
    MATH: {
        id: 'MATH',
        name: 'Toán học',
        icon: '📐',
        color: 'blue',
        description: 'Công thức, Đồ thị, Tư duy logic',
        features: { mathHelper: true }
    },
    LITERATURE: {
        id: 'LITERATURE',
        name: 'Ngữ văn',
        icon: '📚',
        color: 'pink',
        description: 'Văn bản, Cảm thụ, Nghị luận',
        features: { spellCheck: true }
    },
    ENGLISH: {
        id: 'ENGLISH',
        name: 'Tiếng Anh',
        icon: '🇬🇧',
        color: 'indigo',
        description: 'Nghe, Nói, Đọc, Viết',
        features: { audioSupport: true }
    },
    PHYSICS: {
        id: 'PHYSICS',
        name: 'Vật lý',
        icon: '⚛️',
        color: 'cyan',
        description: 'Cơ, Nhiệt, Điện, Quang',
        features: { mathHelper: true }
    },
    CHEMISTRY: {
        id: 'CHEMISTRY',
        name: 'Hóa học',
        icon: '🧪',
        color: 'teal',
        description: 'Chất, Phản ứng, Phương trình',
        features: { mathHelper: true } // for chemical formulas
    },
    BIOLOGY: {
        id: 'BIOLOGY',
        name: 'Sinh học',
        icon: '🧬',
        color: 'emerald',
        description: 'Di truyền, Tiến hóa, Sinh thái',
        features: {}
    },
    HISTORY: {
        id: 'HISTORY',
        name: 'Lịch sử',
        icon: '🏛️',
        color: 'amber',
        description: 'Sự kiện, Mốc thời gian',
        features: { timeline: true }
    },
    GEOGRAPHY: {
        id: 'GEOGRAPHY',
        name: 'Địa lý',
        icon: '🌏',
        color: 'green',
        description: 'Bản đồ, Khí hậu, Dân số',
        features: { map: true }
    },
    CIVIC_EDU: {
        id: 'CIVIC_EDU',
        name: 'GDCD',
        icon: '⚖️',
        color: 'orange',
        description: 'Luật pháp, Đạo đức',
        features: {}
    },
    COMPUTER: {
        id: 'COMPUTER',
        name: 'Tin học',
        icon: '💻',
        color: 'slate',
        description: 'Lập trình, Thuật toán',
        features: { codeEditor: true }
    },
    OTHER: {
        id: 'OTHER',
        name: 'Khác',
        icon: '🎓',
        color: 'gray',
        description: 'Các môn học khác',
        features: {}
    }
};

// --- Context Definition ---

interface SubjectContextType {
    teachingSubjects: SubjectId[];
    primarySubject: SubjectMetadata | null;
    setTeachingSubjects: (subjects: SubjectId[]) => void;
    isLoading: boolean;
    hasSelectedSubjects: boolean;
}

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

// --- Provider Component ---

export function SubjectProvider({ children }: { children: React.ReactNode }) {
    const [teachingSubjects, setTeachingSubjectsState] = useState<SubjectId[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load from localStorage or User Profile (mock for now)
    useEffect(() => {
        const loadSubjects = async () => {
            // TODO: Fetch from API/DB
            // For now, load from localStorage
            const saved = localStorage.getItem('ergonix_teaching_subjects');
            if (saved) {
                try {
                    setTeachingSubjectsState(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse saved subjects", e);
                }
            }
            setIsLoading(false);
        };
        loadSubjects();
    }, []);

    const setTeachingSubjects = (subjects: SubjectId[]) => {
        setTeachingSubjectsState(subjects);
        localStorage.setItem('ergonix_teaching_subjects', JSON.stringify(subjects));

        // TODO: Sync to User Profile in DB via Server Action
    };

    const primarySubject = teachingSubjects.length > 0 ? SUBJECTS_DATA[teachingSubjects[0]] : null;
    const hasSelectedSubjects = teachingSubjects.length > 0;

    return (
        <SubjectContext.Provider value={{
            teachingSubjects,
            primarySubject,
            setTeachingSubjects,
            isLoading,
            hasSelectedSubjects
        }}>
            {children}
        </SubjectContext.Provider>
    );
}

// --- Hook ---

export const useSubject = () => {
    const context = useContext(SubjectContext);
    if (context === undefined) {
        throw new Error('useSubject must be used within a SubjectProvider');
    }
    return context;
};
