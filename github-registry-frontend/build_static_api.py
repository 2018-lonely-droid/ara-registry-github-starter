#!/usr/bin/env python3
"""Generate static API JSON files for GitHub Pages deployment."""

import json
from pathlib import Path

def main():
    # Load registry data
    registry_path = Path(__file__).parent.parent / 'registry'
    index_file = registry_path / 'index.json'
    ownership_file = registry_path / 'ownership.json'

    with open(index_file) as f:
        index = json.load(f)

    with open(ownership_file) as f:
        ownership = json.load(f)

    # Create static API directory
    api_dir = Path(__file__).parent / 'static' / 'api'
    api_dir.mkdir(exist_ok=True)

    # Generate stats
    total_packages = len(index)
    total_downloads = sum(pkg.get('total_downloads', 0) for pkg in index)
    namespaces = set(pkg.get('namespace') for pkg in index)
    total_namespaces = len(namespaces)

    types = {}
    for pkg in index:
        pkg_type = pkg.get('type', 'kiro-agent')
        types[pkg_type] = types.get(pkg_type, 0) + 1

    stats = {
        'total_packages': total_packages,
        'total_downloads': total_downloads,
        'total_namespaces': total_namespaces,
        'package_types': types,
    }

    with open(api_dir / 'stats.json', 'w') as f:
        json.dump(stats, f, indent=2)

    # Generate packages list
    packages_with_owner = []
    for pkg in index:
        pkg_copy = pkg.copy()
        namespace = pkg_copy.get('namespace')
        name = pkg_copy.get('name')
        pkg_key = f'{namespace}/{name}'
        owner = ownership.get('packages', {}).get(pkg_key)
        if owner:
            pkg_copy['owner'] = owner
        packages_with_owner.append(pkg_copy)
    
    packages_data = {
        'packages': packages_with_owner,
        'total': len(packages_with_owner),
        'limit': len(packages_with_owner),
        'offset': 0,
    }

    with open(api_dir / 'packages.json', 'w') as f:
        json.dump(packages_data, f, indent=2)

    # Generate individual package files
    packages_dir = api_dir / 'packages'
    packages_dir.mkdir(exist_ok=True)

    for pkg in index:
        namespace = pkg.get('namespace')
        name = pkg.get('name')
        
        # Add owner info
        pkg_key = f'{namespace}/{name}'
        owner = ownership.get('packages', {}).get(pkg_key)
        if owner:
            pkg['owner'] = owner
        
        # Create namespace directory
        ns_dir = packages_dir / namespace
        ns_dir.mkdir(exist_ok=True)
        
        # Write package file
        with open(ns_dir / f'{name}.json', 'w') as f:
            json.dump(pkg, f, indent=2)

    print(f'✅ Generated static API data:')
    print(f'   - {total_packages} packages')
    print(f'   - {total_namespaces} namespaces')
    print(f'   - Stats, package list, and individual package files')

if __name__ == '__main__':
    main()
