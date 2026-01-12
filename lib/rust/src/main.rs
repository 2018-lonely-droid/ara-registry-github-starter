use clap::{Parser, Subcommand};
use ara_ref::{read_manifest, validate};
use std::path::PathBuf;
use std::process;

#[derive(Parser)]
#[command(name = "ara-ref")]
#[command(about = "ARA manifest reference library")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Validate a ara.json file
    Validate { path: PathBuf },
    /// Read manifest and output as JSON
    Read { path: PathBuf },
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Validate { path } => match validate(&path) {
            Ok(errors) if errors.is_empty() => {
                println!("Valid ara.json");
            }
            Ok(errors) => {
                for err in errors {
                    eprintln!("Error: {}", err);
                }
                process::exit(1);
            }
            Err(e) => {
                eprintln!("Error: {}", e);
                process::exit(1);
            }
        },
        Commands::Read { path } => match read_manifest(&path) {
            Ok(manifest) => {
                println!("{}", serde_json::to_string_pretty(&manifest).unwrap());
            }
            Err(e) => {
                eprintln!("Error: {}", e);
                process::exit(1);
            }
        },
    }
}
