use serde::{Deserialize, Serialize};

const CREDENTIAL_SERVICE: &str = "com.mermaider.desktop.openai";

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct OpenAISecrets {
  api_key: String,
  access_token: String,
  refresh_token: String,
  id_token: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StoredOpenAISecrets {
  api_key: String,
  access_token: String,
  refresh_token: String,
  id_token: String,
}

fn credential(account: &str) -> Result<keyring::Entry, String> {
  keyring::Entry::new(CREDENTIAL_SERVICE, account).map_err(|error| error.to_string())
}

fn save_secret(account: &str, value: &str) -> Result<(), String> {
  let entry = credential(account)?;
  if value.is_empty() {
    match entry.delete_credential() {
      Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
      Err(error) => Err(error.to_string()),
    }
  } else {
    entry.set_password(value).map_err(|error| error.to_string())
  }
}

fn read_secret(account: &str) -> Result<String, String> {
  let entry = credential(account)?;
  match entry.get_password() {
    Ok(value) => Ok(value),
    Err(keyring::Error::NoEntry) => Ok(String::new()),
    Err(error) => Err(error.to_string()),
  }
}

#[tauri::command]
fn save_openai_secrets(secrets: OpenAISecrets) -> Result<(), String> {
  save_secret("api-key", &secrets.api_key)?;
  save_secret("access-token", &secrets.access_token)?;
  save_secret("refresh-token", &secrets.refresh_token)?;
  save_secret("id-token", &secrets.id_token)
}

#[tauri::command]
fn load_openai_secrets() -> Result<StoredOpenAISecrets, String> {
  Ok(StoredOpenAISecrets {
    api_key: read_secret("api-key")?,
    access_token: read_secret("access-token")?,
    refresh_token: read_secret("refresh-token")?,
    id_token: read_secret("id-token")?,
  })
}

#[tauri::command]
fn clear_openai_secrets() -> Result<(), String> {
  save_secret("api-key", "")?;
  save_secret("access-token", "")?;
  save_secret("refresh-token", "")?;
  save_secret("id-token", "")
}

// Decision keys use a separate service and explicit provider accounts.
fn decision_credential(provider: &str) -> Result<keyring::Entry, String> {
  if provider != "jev" && provider != "laya" {
    return Err("Unsupported decision provider".into());
  }
  keyring::Entry::new("com.mermaider.desktop.decisions", provider).map_err(|error| error.to_string())
}

#[tauri::command]
fn save_decision_key(provider: String, key: String) -> Result<(), String> {
  let entry = decision_credential(&provider)?;
  if key.is_empty() {
    match entry.delete_credential() {
      Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
      Err(error) => Err(error.to_string()),
    }
  } else {
    entry.set_password(&key).map_err(|error| error.to_string())
  }
}

#[tauri::command]
fn load_decision_key(provider: String) -> Result<String, String> {
  match decision_credential(&provider)?.get_password() {
    Ok(value) => Ok(value),
    Err(keyring::Error::NoEntry) => Ok(String::new()),
    Err(error) => Err(error.to_string()),
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .invoke_handler(tauri::generate_handler![
      save_openai_secrets,
      load_openai_secrets,
      clear_openai_secrets,
      save_decision_key,
      load_decision_key
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
