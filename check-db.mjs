import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://icwnwahtrasxobebqvcr.supabase.co', 'sb_publishable_mc5TKG02OJDL2iLN7lXNJg_GaB51IW3')

const { data } = await supabase.from('tasks').select('*').limit(3)
console.log('=== 3 premieres tâches ===')
for (const t of data) {
  console.log(JSON.stringify(t, null, 2))
  console.log('---')
}
