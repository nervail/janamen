import { api } from './client';
import type {
	ChapterDetail,
	CourseAssignment,
	CourseDetail,
	DataResponse,
	QuizAnswer,
	QuizResult,
} from '../types/api';

export const COURSES_QUERY_KEY = ['courses'] as const;
export const courseQueryKey = (id: number) =>
	[...COURSES_QUERY_KEY, 'detail', id] as const;
export const chapterQueryKey = (courseId: number, chapterId: number) =>
	[...COURSES_QUERY_KEY, 'chapter', courseId, chapterId] as const;

export async function fetchMyCourses(): Promise<CourseAssignment[]> {
	const { data } = await api.get<DataResponse<CourseAssignment[]>>('/courses');
	return data.data;
}

export async function fetchCourse(id: number): Promise<CourseDetail> {
	const { data } = await api.get<DataResponse<CourseDetail>>(`/courses/${id}`);
	return data.data;
}

export async function fetchChapter(
	courseId: number,
	chapterId: number,
): Promise<ChapterDetail> {
	const { data } = await api.get<DataResponse<ChapterDetail>>(
		`/courses/${courseId}/chapters/${chapterId}`,
	);
	return data.data;
}

export async function markChapterViewed(
	courseId: number,
	chapterId: number,
): Promise<void> {
	await api.post(`/courses/${courseId}/chapters/${chapterId}/viewed`);
}

export async function submitQuiz(
	courseId: number,
	chapterId: number,
	answers: QuizAnswer[],
): Promise<QuizResult> {
	const { data } = await api.post<DataResponse<QuizResult>>(
		`/courses/${courseId}/chapters/${chapterId}/quiz`,
		{ answers },
	);
	return data.data;
}
