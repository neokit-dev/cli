import { load } from '../plugins/list';
import { select, checkbox } from '@inquirer/prompts';
import { cloudflareOrange, nodeGreen, c } from '../colors';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { required } from '../plugins/required';

export interface SetupOptions {
  hook?: boolean;
}

export async function setup(options: SetupOptions) {
  if (!existsSync('svelte.config.js')) {
    console.log(
      c.redBright(`
This command must be run in a SvelteKit project.
If you haven't created a project yet, run ${c.whiteBright.underline(
        'npx sv create'
      )} to create one.`)
    );
    process.exit(1);
  }

  process.stdout.write(c.blueBright('Loading plugin list... '));
  const pluginList = await load();
  console.log(c.greenBright('done.\n'));
  const env = (await select({
    message: 'Which environment do you want to deploy to?',
    choices: [
      {
        name: `${cloudflareOrange('\ue792')} Cloudflare Pages`,
        value: 'cloudflare',
      },
      {
        name: `${cloudflareOrange('\ue793')} Cloudflare Workers`,
        value: 'cloudflare-workers',
      },
      { name: `${nodeGreen('\udb80\udf99')} Node.js`, value: 'node' },
    ],
  }).catch(() => {
    console.log(c.redBright('\nAborted.'));
    process.exit(1);
  })) as string;

  let adapter: string;
  switch (env) {
    default:
      adapter = '@sveltejs/adapter-' + env;
      break;
  }

  process.stdout.write(
    c.blueBright(`\nInstalling adapter (${c.yellowBright(adapter)})... `)
  );
  try {
    execSync(`npm i -D ${adapter}`, { stdio: 'ignore' });
  } catch (e) {
    console.log(c.redBright('failed!\n'));
    console.log(c.redBright('Error: ' + e.message));
    process.exit(1);
  }
  console.log(c.greenBright('done.'));

  process.stdout.write(c.blueBright('Updating svelte.config.js... '));
  writeFileSync(
    'svelte.config.js',
    readFileSync('svelte.config.js', 'utf8').replace(
      "from '@sveltejs/adapter-auto'",
      `from '${adapter}'`
    )
  );
  console.log(c.greenBright('done.'));

  process.stdout.write(
    c.blueBright(
      `Removing auto adapter (${c.yellowBright('@sveltejs/adapter-auto')})... `
    )
  );
  try {
    execSync('npm un @sveltejs/adapter-auto', { stdio: 'ignore' });
  } catch (e) {
    console.log(c.redBright('failed!\n'));
    console.log(c.redBright('Error: ' + e.message));
    process.exit(1);
  }
  console.log(c.greenBright('done.\n'));

  process.stdout.write(
    c.blueBright(
      `Installing NeoKit (${c.yellowBright('@neokit-dev/core')})... `
    )
  );
  try {
    execSync('npm i -D @neokit-dev/core', { stdio: 'ignore' });
  } catch (e) {
    console.log(c.redBright('failed!\n'));
    console.log(c.redBright('Error: ' + e.message));
    process.exit(1);
  }
  console.log(c.greenBright('done.\n'));

  const plugins = Object.keys(pluginList).filter(
    (plugin) => pluginList[plugin].env?.includes(env) ?? true
  );

  const selectedPlugins = (await checkbox({
    message: 'Select plugins to install',
    choices: plugins.map((plugin) => ({
      name:
        c.hex(pluginList[plugin].color ?? 'ffffff')(
          (pluginList[plugin].icon ?? ' ') + ' '
        ) + (pluginList[plugin].name ?? plugin),
      value: plugin,
    })),
  }).catch(() => {
    console.log(c.redBright('\nAborted.'));
    process.exit(1);
  })) as string[];

  console.log();
  const installed = [];
  selectedPlugins.forEach((plugin) => {
    const req = required(pluginList, plugin);
    req.forEach((p) =>
      console.log(
        c.yellowBright(
          `${c.whiteBright(
            pluginList[p].name ?? p
          )} is required by ${c.whiteBright(
            pluginList[plugin].name ?? plugin
          )} and will be installed as well.`
        )
      )
    );

    const install = [...req, plugin];
    install.forEach((p) => {
      if (!installed.includes(p)) installed.push(p);
    });
    process.stdout.write(
      c.blueBright(
        `Installing ${c.whiteBright(
          install.map((p) => pluginList[p].name ?? p).join(c.blueBright(', '))
        )}... `
      )
    );
    try {
      execSync(`npm i -D ${install.map((p) => '@neokit-dev/' + p).join(' ')}`, {
        stdio: 'ignore',
      });
    } catch (e) {
      console.log(c.redBright('failed!\n'));
      console.log(c.redBright('Error: ' + e.message));
      process.exit(1);
    }
    console.log(c.greenBright('done.'));
  });

  if (options.hook) {
    process.stdout.write(c.blueBright('\nAdding NeoKit hook... '));
    writeFileSync(
      'src/hooks.server.ts',
      `\
import { load, handle } from '@neokit-dev/core';
${installed
  .map(
    (p) =>
      `import { plugin as ${p.replaceAll(
        '-',
        ''
      )}Plugin } from '@neokit-dev/${p}';`
  )
  .join('\n')}

load(
  ${installed.map((p) => `${p.replaceAll('-', '')}Plugin({})`).join(',\n  ')}
);

export { handle };
`
    );
    console.log(c.greenBright('done.'));

    console.log(c.whiteBright(`
Please note that some plugins may require additional setup and need to be configured manually in ${c.underline('src/hooks.server.ts')}.`));
  }

  console.log(c.greenBright('\nSetup complete!'));
}
