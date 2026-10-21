import { planProject } from '@forgekit/core';

import { errorResponse } from '@/lib/http';
import { buildProjectRequest, formToRawProject, type RawProjectInput } from '@/lib/project-request';

export const dynamic = 'force-dynamic';

async function readInput(request: Request): Promise<RawProjectInput> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as RawProjectInput;
    return body ?? {};
  }
  return formToRawProject(await request.formData());
}

export async function POST(request: Request): Promise<Response> {
  try {
    const input = await buildProjectRequest(await readInput(request));
    const plan = await planProject(input);
    return Response.json({
      projectName: plan.resolved.name,
      packageName: plan.resolved.packageName,
      fileCount: plan.fileCount,
      totalBytes: plan.totalBytes,
      files: plan.files,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
