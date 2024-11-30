import axios from 'axios';

// DTO 타입 정의
interface QuizResDto {
  isCorrect: boolean;
  prizeMoney: number;
}

interface ReturnSubmitQuizType {
  data: QuizResDto;
  result: string;
}

// 토큰 포함 POST 요청 함수
export const submitQuizAnswer = async (
  isCorrect: boolean,
  prizeMoney: number,
  token: string
): Promise<ReturnSubmitQuizType> => {
  try {
    const response = await axios.post(
      'http://localhost:8080/api/quiz/submit',
      { isCorrect, prizeMoney }, // DTO 구조에 맞춘 요청 바디
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; // 서버의 응답 데이터 반환
  } catch (error) {
    console.error('퀴즈 정답 제출 중 오류:', error);
    throw error;
  }
};
