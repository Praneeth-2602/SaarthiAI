param(
    [string]$Remote = "origin",
    [string]$Branch = "",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Write-Host ("git " + ($Arguments -join " "))
    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($Arguments -join ' ')"
    }
}

function Get-CurrentBranch {
    $name = (& git branch --show-current).Trim()
    if (-not $name) {
        throw "Unable to determine the current git branch."
    }
    return $name
}

function Commit-Paths {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [Parameter(Mandatory = $true)]
        [string[]]$Paths,
        [switch]$UpdateOnly
    )

    if ($UpdateOnly) {
        Invoke-Git -Arguments (@("add", "--update", "--") + $Paths)
    }
    else {
        Invoke-Git -Arguments (@("add", "--") + $Paths)
    }

    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Skipping empty commit: $Message"
        return
    }

    if ($DryRun) {
        Write-Host "Dry run: would commit '$Message'"
        Invoke-Git -Arguments (@("reset", "--") + $Paths)
        return
    }

    Invoke-Git -Arguments @("commit", "-m", $Message)
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$targetBranch = if ($Branch) { $Branch } else { Get-CurrentBranch }

Write-Host "Preparing grouped rebuild commits for $targetBranch -> $Remote"

$commitPlan = @(
    @{
        Message = "chore: refresh root scripts and environment setup"
        Paths = @(".env.example", ".gitignore", "package.json", "package-lock.json", "docker-compose.yml")
        UpdateOnly = $false
    },
    @{
        Message = "docs: rewrite README for the new fastapi and nextjs setup"
        Paths = @("README.md")
        UpdateOnly = $false
    },
    @{
        Message = "feat: add unified fastapi backend entrypoint"
        Paths = @("backend/__init__.py", "backend/main.py", "backend/Dockerfile", "backend/requirements.txt")
        UpdateOnly = $false
    },
    @{
        Message = "feat: add backend configuration auth and persistence modules"
        Paths = @(
            "backend/app/__init__.py",
            "backend/app/config.py",
            "backend/app/db.py",
            "backend/app/auth.py",
            "backend/app/storage.py"
        )
        UpdateOnly = $false
    },
    @{
        Message = "feat: add integrated backend agent workflow"
        Paths = @(
            "backend/app/agents/__init__.py",
            "backend/app/agents/knowledge.py",
            "backend/app/agents/orchestrator.py",
            "backend/app/main.py"
        )
        UpdateOnly = $false
    },
    @{
        Message = "refactor: redesign landing auth and dashboard shell"
        Paths = @(
            "frontend/app/layout.tsx",
            "frontend/app/page.tsx",
            "frontend/app/(auth)/login/page.tsx",
            "frontend/app/(auth)/verify/page.tsx",
            "frontend/components/layout/DashboardShell.tsx",
            "frontend/components/layout/DashboardHome.tsx"
        )
        UpdateOnly = $false
    },
    @{
        Message = "feat: rebuild case workspace and status surfaces"
        Paths = @(
            "frontend/components/case/CaseWorkspace.tsx",
            "frontend/components/case/ClaimStatus.tsx",
            "frontend/components/case/DocumentChecklist.tsx",
            "frontend/components/case/PolicyCard.tsx",
            "frontend/app/(dashboard)/documents/page.tsx",
            "frontend/app/(dashboard)/chat/page.tsx"
        )
        UpdateOnly = $false
    },
    @{
        Message = "feat: refresh chat experience and frontend api integration"
        Paths = @(
            "frontend/components/chat/ChatPanel.tsx",
            "frontend/components/chat/LanguageSelector.tsx",
            "frontend/components/chat/MessageBubble.tsx",
            "frontend/lib/api.ts"
        )
        UpdateOnly = $false
    },
    @{
        Message = "style: introduce the new pastel grief sensitive visual system"
        Paths = @(
            "frontend/app/globals.css",
            "frontend/next.config.ts",
            "frontend/next-env.d.ts",
            "frontend/tsconfig.json"
        )
        UpdateOnly = $false
    },
    @{
        Message = "chore: remove obsolete node api and split agent service"
        Paths = @("backend/api", "backend/agents")
        UpdateOnly = $true
    },
    @{
        Message = "chore: add push helper for grouped rebuild publishing"
        Paths = @("scripts/push-rebuild.ps1")
        UpdateOnly = $false
    }
)

foreach ($commit in $commitPlan) {
    Commit-Paths -Message $commit.Message -Paths $commit.Paths -UpdateOnly:([bool]$commit.UpdateOnly)
}

if ($DryRun) {
    Write-Host "Dry run complete. No commits or push were created."
    exit 0
}

Write-Host "Pushing grouped commits to $Remote/$targetBranch"
Invoke-Git -Arguments @("push", $Remote, "HEAD:$targetBranch")
