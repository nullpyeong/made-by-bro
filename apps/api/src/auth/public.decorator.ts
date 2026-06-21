import { SetMetadata } from '@nestjs/common';

// 전역 JwtAuthGuard를 우회(익명 허용)하는 라우트 표시.
// 랜딩/회원가입/로그인 등 비로그인 접근 라우트에 @Public()을 붙인다.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
