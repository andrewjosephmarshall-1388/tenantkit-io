import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const applicationId = formData.get('applicationId') as string;

    if (!file || !applicationId) {
      return NextResponse.json({ error: 'Missing file or applicationId' }, { status: 400 });
    }

    // Ensure the column exists
    try {
      await supabase.rpc('exec_sql', { 
        sql: `ALTER TABLE IF EXISTS applications ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;` 
      })
    } catch {
      // Ignore error if column exists
    }

    // Upload to storage
    const fileName = `reports/${applicationId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('application-files')
      .upload(fileName, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('application-files')
      .getPublicUrl(fileName);

    // Update application
    const { error: updateError } = await supabase
      .from('applications')
      .update({ inspection_report_url: publicUrl })
      .eq('id', applicationId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}