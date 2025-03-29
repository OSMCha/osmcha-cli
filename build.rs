use std::env;
use std::path::Path;
use std::process::Command;
use std::{fs, io};

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();

    // Tell Cargo that if anything in the frontend/ directory changes, it should
    // rerun this build script.
    println!("cargo::rerun-if-changed=frontend");

    // Copy the entire frontend directory into the OUT_DIR. We need to do this
    // because building the frontend code requires installing node_modules and
    // generating files in dist/, and Cargo will refuse to build if build.rs
    // "dirties" the source directory.
    copy_dir_all("frontend", &format!("{}/frontend", &out_dir))
        .expect("copying frontend code to OUT_DIR failed");

    // Run npm install for frontend/ (in the OUT_DIR)
    Command::new("npm")
        .args(&["install"])
        .current_dir(&format!("{}/frontend", &out_dir))
        .status()
        .expect("'npm install' failed");

    // Run npm run build for frontend/ (in the OUT_DIR)
    Command::new("npm")
        .args(&["run", "build"])
        .current_dir(&format!("{}/frontend", &out_dir))
        .status()
        .expect("'npm run build' failed");
}

fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}
