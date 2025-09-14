const fs = require("fs").promises;
const path = require("path");

// Defina o caminho base conforme necessário, padrão é o diretório atual do script
const BASE_PATH = path.join(__dirname, "home", "valcann");

const FOLDER_PATH = path.join(BASE_PATH, "backupsFrom");
const ARCHIVE_PATH = path.join(BASE_PATH, "backupsTo");
const LOG_FROM_PATH = path.join(BASE_PATH, "backupsFrom.log");
const LOG_TO_PATH = path.join(BASE_PATH, "backupsTo.log");

// Modifique o primeiro número da operação para alterar o número de dias
const DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;

// Assegura que os diretórios existem
const ensureDirectoriesExist = async () => {
  await fs.mkdir(ARCHIVE_PATH, { recursive: true });
  await fs.mkdir(FOLDER_PATH, { recursive: true });
};

/**
 * @param {string[]} files - Lista de nomes de arquivos no diretório de origem.
 */
// Gerar relatório inicial dos arquivos encontrados
const generateInitialReport = async (files) => {
  let reportContent = "Relatório de Arquivos Encontrados em backupsFrom:\n";
  reportContent += "---------------------------------------------------\n";

  for (const file of files) {
    try {
      const filePath = path.join(FOLDER_PATH, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        reportContent += `Nome: ${file}\n`;
        reportContent += `Tamanho: ${stats.size} bytes\n`;
        reportContent += `Data de Criação: ${stats.birthtime.toISOString()}\n`;
        reportContent += `Última Modificação: ${stats.mtime.toISOString()}\n`;
        reportContent +=
          "---------------------------------------------------\n";
      }
    } catch (error) {
      console.error(
        `Não foi possível obter informações do arquivo ${file}: ${error.message}`
      );
    }
  }
  await fs.writeFile(LOG_FROM_PATH, reportContent);
};

/**
 * @param {string} message - Mensagem a ser registrada no log.
 */
// Registrar ações no log
const logAction = async (message) => {
  const timestamp = new Date().toISOString();
  await fs.appendFile(LOG_TO_PATH, `[${timestamp}] ${message}\n`);
};

/**
 * @param {string} file - Nome do arquivo a ser processado.
 */
// Processar cada arquivo individualmente
const processFile = async (file) => {
  const filePath = path.join(FOLDER_PATH, file);
  try {
    const stats = await fs.stat(filePath);

    if (!stats.isFile()) {
      return;
    }

    if (stats.birthtime.getTime() < Date.now() - DAYS_IN_MS) {
      await fs.unlink(filePath);
      console.log(`Arquivo removido: ${file}`);
      await logAction(
        `REMOVIDO: O arquivo "${file}" foi removido por ser mais antigo que 3 dias.`
      );
    } else {
      const destinationPath = path.join(ARCHIVE_PATH, file);
      await fs.rename(filePath, destinationPath);
      console.log(`Arquivo movido: ${file} para ${ARCHIVE_PATH}`);
      await logAction(
        `MOVIDO: O arquivo "${file}" foi movido para "${ARCHIVE_PATH}".`
      );
    }
  } catch (error) {
    console.error(`Erro ao processar o arquivo ${file}:`, error.message);
    await logAction(
      `ERRO: Falha ao processar o arquivo "${file}". Motivo: ${error.message}`
    );
  }
};

// Função principal para executar o script
const main = async () => {
  console.log("Iniciando script de gerenciamento de backups...");

  try {
    await ensureDirectoriesExist();
    await fs.writeFile(
      LOG_TO_PATH,
      "Relatório de Ações de Cópia e Remoção:\n---------------------------------------------------\n"
    );

    const files = await fs.readdir(FOLDER_PATH);

    if (files.length === 0) {
      console.log("Nenhum arquivo encontrado em backupsFrom para processar.");
      await fs.writeFile(
        LOG_FROM_PATH,
        "Nenhum arquivo encontrado no diretório backupsFrom."
      );
      return;
    }

    await generateInitialReport(files);
    console.log(`Relatório inicial salvo em: ${LOG_FROM_PATH}`);

    const processingPromises = files.map(processFile);
    await Promise.all(processingPromises);
    console.log(
      `Script finalizado com sucesso! Log de ações salvo em: ${LOG_TO_PATH}`
    );
  } catch (error) {
    console.error("Ocorreu um erro crítico durante a execução:", error.message);
    await logAction(`CRÍTICO: O script falhou com o erro: ${error.message}`);
  }
};

main();
