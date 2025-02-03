use std::env;
use std::process::Command;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();

    // Tell Cargo that if anything in the frontend/ directory changes, it should
    // rerun this build script.
    println!("cargo::rerun-if-changed=frontend");

    // Copy the entire frontend directory into the OUT_DIR. We need to do this
    // because building the frontend code requires installing node_modules and
    // generating files in dist/, and Cargo will refuse to build if build.rs
    // "dirties" the source directory.
    Command::new("cp")
        .args(&["-r", "frontend/", &format!("{}/frontend", &out_dir)])
        .status()
        .ok()
        .expect("copying frontend code to OUT_DIR failed");

    // Run npm install for frontend/ (in the OUT_DIR)
    Command::new("npm")
        .args(&["install"])
        .current_dir(&format!("{}/frontend", &out_dir))
        .status()
        .ok()
        .expect("'npm install' failed");

    // Run npm run build for frontend/ (in the OUT_DIR)
    Command::new("npm")
        .args(&["run", "build"])
        .current_dir(&format!("{}/frontend", &out_dir))
        .status()
        .ok()
        .expect("'npm run build' failed");
}
