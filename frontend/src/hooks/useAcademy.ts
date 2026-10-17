import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	chapterQueryKey,
	courseQueryKey,
	COURSES_QUERY_KEY,
	fetchChapter,
	fetchCourse,
	fetchMyCourses,
	markChapterViewed,
	submitQuiz,
} from '../api/academy';
import type { QuizAnswer } from '../types/api';

const isValidId = (id: number) => Number.isInteger(id) && id > 0;

export function useMyCourses() {
	return useQuery({
		queryKey: [...COURSES_QUERY_KEY, 'list'],
		queryFn: fetchMyCourses,
	});
}

export function useCourse(id: number) {
	return useQuery({
		queryKey: courseQueryKey(id),
		queryFn: () => fetchCourse(id),
		enabled: isValidId(id),
	});
}

export function useChapter(courseId: number, chapterId: number) {
	return useQuery({
		queryKey: chapterQueryKey(courseId, chapterId),
		queryFn: () => fetchChapter(courseId, chapterId),
		enabled: isValidId(courseId) && isValidId(chapterId),
	});
}

// Прогресс курса виден в «Моих курсах», на дашборде и у руководителя в «Моей команде»
function useInvalidateAcademy() {
	const queryClient = useQueryClient();
	return () => {
		void queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
		void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
		void queryClient.invalidateQueries({ queryKey: ['team'] });
		void queryClient.invalidateQueries({ queryKey: ['notifications'] });
	};
}

export function useMarkChapterViewed(courseId: number, chapterId: number) {
	const invalidate = useInvalidateAcademy();
	return useMutation({
		mutationFn: () => markChapterViewed(courseId, chapterId),
		onSuccess: invalidate,
	});
}

export function useSubmitQuiz(courseId: number, chapterId: number) {
	const invalidate = useInvalidateAcademy();
	return useMutation({
		mutationFn: (answers: QuizAnswer[]) =>
			submitQuiz(courseId, chapterId, answers),
		onSuccess: invalidate,
	});
}
