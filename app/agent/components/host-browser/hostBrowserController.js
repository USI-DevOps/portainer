import _ from 'lodash-es';

const ROOT_PATH = '/host/home/chaim/Downloads';

export class HostBrowserController {
  constructor($async, HostBrowserService, Notifications, FileSaver, ModalService) {
    Object.assign(this, { $async, HostBrowserService, Notifications, FileSaver, ModalService });

    this.state = {
      path: ROOT_PATH,
    };

    this.goToParent = this.goToParent.bind(this);
    this.browse = this.browse.bind(this);
    this.confirmDeleteFile = this.confirmDeleteFile.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.isRoot = this.isRoot.bind(this);
    this.onFileSelectedForUpload = this.onFileSelectedForUpload.bind(this);
    this.getRelativePath = this.getRelativePath.bind(this);
    this.getFilesForPath = this.getFilesForPath.bind(this);
    this.getFilesForPathAsync = this.getFilesForPathAsync.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.downloadFileAsync = this.downloadFileAsync.bind(this);
    this.renameFile = this.renameFile.bind(this);
    this.renameFileAsync = this.renameFileAsync.bind(this);
  }

  getRelativePath(path) {
    path = path || this.state.path;
    const rootPathRegex = new RegExp('^' + ROOT_PATH + '/?');
    const relativePath = path.replace(rootPathRegex, '/');
    return relativePath;
  }

  goToParent() {
    this.getFilesForPath(this.parentPath(this.state.path));
  }

  isRoot() {
    return this.state.path === ROOT_PATH;
  }

  browse(folder) {
    this.getFilesForPath(this.buildPath(this.state.path, folder));
  }

  getFilesForPath(path) {
    return this.$async(this.getFilesForPathAsync, path);
  }
  async getFilesForPathAsync(path) {
    try {
      const files = await this.HostBrowserService.ls(path);
      this.state.path = path;
      this.files = files;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to browse');
    }
  }

  renameFile(name, newName) {
    return this.$async(this.renameFileAsync, name, newName);
  }
  async renameFileAsync(name, newName) {
    const filePath = this.buildPath(this.state.path, name);
    const newFilePath = this.buildPath(this.state.path, newName);
    try {
      await this.HostBrowserService.rename(filePath, newFilePath);
      this.Notifications.success('File successfully renamed', this.getRelativePath(newFilePath));
      const files = await this.HostBrowserService.ls(this.state.path);
      this.files = files;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to rename file');
    }
  }

  downloadFile(fileName) {
    return this.$async(this.downloadFileAsync, fileName);
  }
  async downloadFileAsync(fileName) {
    const filePath = this.buildPath(this.state.path, fileName);
    try {
      const { file } = await this.HostBrowserService.get(filePath);
      const downloadData = new Blob([file], {
        type: 'text/plain;charset=utf-8',
      });
      this.FileSaver.saveAs(downloadData, fileName);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to download file');
    }
  }

  confirmDeleteFile(name) {
    const filePath = this.buildPath(this.state.path, name);

    this.ModalService.confirmDeletion('Are you sure that you want to delete ' + this.getRelativePath(filePath) + ' ?', (confirmed) => {
      if (!confirmed) {
        return;
      }
      return this.deleteFile(filePath);
    });
  }

  deleteFile(path) {
    this.HostBrowserService.delete(path)
      .then(() => {
        this.Notifications.success('File successfully deleted', this.getRelativePath(path));
        return this.HostBrowserService.ls(this.state.path);
      })
      .then((data) => {
        this.files = data;
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to delete file');
      });
  }

  $onInit() {
    this.getFilesForPath(ROOT_PATH);
  }

  parentPath(path) {
    if (path === ROOT_PATH) {
      return ROOT_PATH;
    }

    const split = _.split(path, '/');
    return _.join(_.slice(split, 0, split.length - 1), '/');
  }

  buildPath(parent, file) {
    if (parent.lastIndexOf('/') === parent.length - 1) {
      return parent + file;
    }
    return parent + '/' + file;
  }

  onFileSelectedForUpload(file) {
    this.HostBrowserService.upload(this.state.path, file)
      .then(() => {
        this.onFileUploaded();
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to upload file');
      });
  }

  onFileUploaded() {
    this.refreshList();
  }

  refreshList() {
    this.getFilesForPath(this.state.path);
  }
}