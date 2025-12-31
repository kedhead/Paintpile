import Link from 'next/link';
import { Project } from '@/types/project';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/utils/constants';

interface ProjectListProps {
  projects: Project[];
  emptyMessage?: string;
}

export function ProjectList({ projects, emptyMessage = 'No projects yet' }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 py-8">
            <p>{emptyMessage}</p>
            <Link href="/projects/new" className="text-primary-500 hover:text-primary-600 font-medium mt-2 inline-block">
              Create your first project
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const projectType = PROJECT_TYPES.find((t) => t.value === project.type)?.label || project.type;
        const projectStatus = PROJECT_STATUSES.find((s) => s.value === project.status)?.label || project.status;

        return (
          <Link key={project.projectId} href={`/projects/${project.projectId}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    {projectType}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'completed' ? 'bg-success-100 text-success-700' :
                    project.status === 'in-progress' ? 'bg-secondary-100 text-secondary-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {projectStatus}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{project.photoCount} photos</span>
                  <span>{formatRelativeTime(project.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
