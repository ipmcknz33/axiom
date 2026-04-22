"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseServerClient = createSupabaseServerClient;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("@/lib/env");
function createSupabaseServerClient() {
    const env = (0, env_1.getServerEnv)();
    return (0, supabase_js_1.createClient)(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}
