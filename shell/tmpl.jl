import HTTP
import DotEnv
import JSON

DotEnv.load!()
local_key = ENV["LOCAL_KEY"]

query(q::String)::Any = HTTP.get("https://strela-vlna.gchd.cz/local/query?" * HTTP.escapeuri("q", q), headers=Dict("Authorization"=>key), retry=false).body |> String |> JSON.parse

struct Team
  Id::String
  Created::String
end
