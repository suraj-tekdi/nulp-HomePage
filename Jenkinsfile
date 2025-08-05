@Library('deploy-conf') _
node('build-slave') {
    try {
        String ANSI_GREEN = "\u001B[32m"
        String ANSI_NORMAL = "\u001B[0m"
        String ANSI_BOLD = "\u001B[1m"
        String ANSI_RED = "\u001B[31m"
        String ANSI_YELLOW = "\u001B[33m"

        ansiColor('xterm') {
          timestamps {
            stage('Checkout') {
                folder = new File("$WORKSPACE/.git")
                if (folder.exists())
                   {
                     println "Found .git folder. Clearing it.."
                     sh'git clean -fxd'
                   }  
                checkout scm
                if (params.diksha_tenant_tag == "main") {
                def scmVars = checkout scm
                checkout scm: ([$class: 'GitSCM', branches: [[name: "refs/heads/main"]], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'CloneOption', depth: 0, noTags: false, reference: '', shallow: true]], submoduleCfg: [], userRemoteConfigs: [[credentialsId: 'github-credentials', url: 'https://github.com/NIUANULP/nulp-HomePage.git']]])
                commit_hash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                branch_name = sh(script: 'git name-rev --name-only HEAD | rev | cut -d "/" -f1| rev', returnStdout: true).trim()
                build_tag = branch_name + "_" + commit_hash + "_" + env.BUILD_NUMBER
                println(ANSI_BOLD + ANSI_YELLOW + "diksha_tenant_tag not specified, using the latest commit hash: " + commit_hash + ANSI_NORMAL)
            } else {
                def scmVars = checkout scm
                checkout scm: ([$class: 'GitSCM', branches: [[name: "refs/tags/params.diksha_tenant_tag"]], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'CloneOption', depth: 0, noTags: false, reference: '', shallow: true]], submoduleCfg: [], userRemoteConfigs: [[credentialsId: 'github-credentials', url: 'https://github.com/NIUANULP/nulp-HomePage.git']]])
                build_tag = params.diksha_tenant_tag + "_" + env.BUILD_NUMBER
                println(ANSI_BOLD + ANSI_YELLOW + "diksha_tenant_tag specified, building from tag: " + params.diksha_tenant_tag + ANSI_NORMAL)
            }
            echo "build_tag: " + build_tag
            }

            stage('Build') {
                // values = docker_params()
                if (params.build_number == "") {
                    println(ANSI_BOLD + ANSI_YELLOW + "Setting build_number to lastSuccessfulBuild to copy metadata.json" + ANSI_NORMAL)
                    buildNumber = "lastSuccessfulBuild"
                } else
                    buildNumber = params.build_number

                values = [:]
                try {
                    copyArtifacts projectName: params.absolute_job_path, fingerprintArtifacts: true, flatten: true, selector: specific(buildNumber)
                }
                catch (err) {
                    println ANSI_YELLOW + ANSI_BOLD + "Ok that failed!. Lets try an alertnative.." + ANSI_NORMAL
                    copyArtifacts projectName: params.absolute_job_path, flatten: true, selector: upstream()
                }
                currentWs = sh(returnStdout: true, script: 'pwd').trim()
                image_tag = sh(returnStdout: true, script: 'jq -r .image_tag metadata.json').trim()
                agent = sh(returnStdout: true, script: 'jq -r .node_name metadata.json').trim()
                image_name = sh(returnStdout: true, script: 'jq -r .image_name metadata.json').trim()
                commit_hash = sh(returnStdout: true, script: 'jq -r .commit_hash metadata.json').trim()
                values.put('image_name', image_name)
                values.put('image_tag', image_tag)
                values.put('commit_hash', commit_hash)
                sh '''
                  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                  export NVM_DIR="$HOME/.nvm"
                  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

                  nvm install 20
                  nvm use 20

                  node -v
                  npm -v

                  npm install --legacy-peer-deps
                  npm run build
                '''

                sh("bash build.sh ${values.image_tag} ${env.NODE_NAME} ${hub_org} ${values.image_name} ${build_tag} ${commit_hash}")
            }
            stage('ArchiveArtifacts') {
                archiveArtifacts "metadata.json"
                cdn_file_exists = new File("$currentWs/index_cdn.ejs")
                if (cdn_file_exists.exists()) {
                    archiveArtifacts "index_cdn.ejs, cdn_assets.zip"
                }
                currentBuild.description = "${values.image_tag}"
            }
          }    
        }

    }
    catch (err) {
        currentBuild.result = "FAILURE"
        throw err
    }

}
