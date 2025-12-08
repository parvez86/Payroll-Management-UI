import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'dashboard/employees/edit/:id',
    renderMode: RenderMode.Server // Disable prerendering for dynamic route
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
