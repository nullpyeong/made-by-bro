import { SetMetadata } from '@nestjs/common';

// 라우트/컨트롤러에 허용 role을 단다. RolesGuard가 이 메타데이터를 읽어 검사.
// 예: @Roles('admin')  /  @Roles('admin', 'instructor')
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
