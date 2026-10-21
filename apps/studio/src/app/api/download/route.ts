import { createArchiveBuffer, planFiles, validateProjectOptions } from '@forgekit/core';

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
    const resolved = validateProjectOptions(input);
    const { files } = await planFiles(resolved);
    const archive = createArchiveBuffer(resolved.name, files);

    return new Response(new Uint8Array(archive), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${resolved.packageName}.zip"`,
        'Content-Length': String(archive.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
