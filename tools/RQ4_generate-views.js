
var generateSelectColumns = (tableAlias, gen) => {
	const gexCols = 'RepoPathOrUrl,IsInitialCommit,IsMergeCommit,NumberOfParentCommits,NumberOfFilesAdded,NumberOfFilesAddedNet,NumberOfLinesAddedByAddedFiles,NumberOfLinesAddedByAddedFilesNet,NumberOfFilesDeleted,NumberOfFilesDeletedNet,NumberOfLinesDeletedByDeletedFiles,NumberOfLinesDeletedByDeletedFilesNet,NumberOfFilesModified,NumberOfFilesModifiedNet,NumberOfFilesRenamed,NumberOfFilesRenamedNet,NumberOfLinesAddedByModifiedFiles,NumberOfLinesAddedByModifiedFilesNet,NumberOfLinesDeletedByModifiedFiles,NumberOfLinesDeletedByModifiedFilesNet,NumberOfLinesAddedByRenamedFiles,NumberOfLinesAddedByRenamedFilesNet,NumberOfLinesDeletedByRenamedFiles,NumberOfLinesDeletedByRenamedFilesNet,Density,AffectedFilesRatioNet'.split(',');

	return gexCols.map(col => {
		// e.g., 'gex2.NumberOfFilesAddedNet AS gen2_NumberOfFilesAddedNet'
		return `${tableAlias}.${col} AS gen${gen}_${col}`;
	}).join(', ');
};

var generateSelectStatementForA = (generation = 1) => {
	const generations = [];
	for (let i = 1; i <= generation; i++) { generations.push(i); }
	
	return 'SELECT x.*, gex0.ParentCommitSHA1s, gex0.RepoPathOrUrl, ' +
		generations.map(gen => {
			return generateSelectColumns(`gex${gen}`, gen);
		}).join(',\n') +

		' FROM `x1151` AS X INNER JOIN `gtools_ex` AS gex0 ON X.commitid = gex0.SHA1 \n' +
		generations.map(gen => {
			return 'INNER JOIN `gtools_ex` AS ' + `gex${gen} ON gex${gen}.SHA1 = gex${gen - 1}.ParentCommitSHA1s AND gex${gen}.IsMergeCommit = 0`;
		}).join('\n') +

		' WHERE gex0.IsMergeCommit = 0';
};

var generateSelectStatementForB = (generation = 1) => {
	const generations = [];
	for (let i = 1; i <= generation; i++) { generations.push(i); }
	
	return 'SELECT x.label, gex0.*, ' +
		generations.map(gen => {
			return generateSelectColumns(`gex${gen}`, gen);
		}).join(',\n') +

		' FROM `x1151` AS X INNER JOIN `gtools_ex` AS gex0 ON X.commitid = gex0.SHA1 \n' +
		generations.map(gen => {
			return 'INNER JOIN `gtools_ex` AS ' + `gex${gen} ON gex${gen}.SHA1 = gex${gen - 1}.ParentCommitSHA1s AND gex${gen}.IsMergeCommit = 0`;
		}).join('\n') +

		' WHERE gex0.IsMergeCommit = 0';
};

var generateSelectStatementForC = (generation = 1) => {
	const generations = [];
	for (let i = 1; i <= generation; i++) { generations.push(i); }
	
	return 'SELECT x.*, gex0.*, ' +
		generations.map(gen => {
			return generateSelectColumns(`gex${gen}`, gen);
		}).join(',\n') +

		' FROM `x1151` AS X INNER JOIN `gtools_ex` AS gex0 ON X.commitid = gex0.SHA1 \n' +
		generations.map(gen => {
			return 'INNER JOIN `gtools_ex` AS ' + `gex${gen} ON gex${gen}.SHA1 = gex${gen - 1}.ParentCommitSHA1s AND gex${gen}.IsMergeCommit = 0`;
		}).join('\n') +

		' WHERE gex0.IsMergeCommit = 0';
};

var generateSelectStatementForD = (generation = 1) => {
	const generations = [];
	for (let i = 1; i <= generation; i++) { generations.push(i); }

	// All but the code-changes.
	const xCols = 'commitId,project,comment,label,kw_add,kw_allow,kw_bug,kw_chang,kw_error,kw_fail,kw_fix,kw_implement,kw_improv,kw_issu,kw_method,kw_new,kw_npe,kw_refactor,kw_remov,kw_report,kw_set,kw_support,kw_test,kw_use'.split(',').map(c => `x.${c}`).join(', ');
	
	return `SELECT ${xCols}, gex0.*, ` +
		generations.map(gen => {
			return generateSelectColumns(`gex${gen}`, gen);
		}).join(',\n') +

		' FROM `x1151` AS X INNER JOIN `gtools_ex` AS gex0 ON X.commitid = gex0.SHA1 \n' +
		generations.map(gen => {
			return 'INNER JOIN `gtools_ex` AS ' + `gex${gen} ON gex${gen}.SHA1 = gex${gen - 1}.ParentCommitSHA1s AND gex${gen}.IsMergeCommit = 0`;
		}).join('\n') +

		' WHERE gex0.IsMergeCommit = 0';
};

var generateViewsForA = (generations = [1, 2, 3, 4, 5, 6, 7, 8]) => {
	return generations.map(gen => {
		const viewName = `rq4_a_gen${gen}`;

		return `DROP VIEW IF EXISTS ${viewName}; CREATE VIEW ${viewName} AS ${generateSelectStatementForA(gen)};`
	}).join(' \n\n ');
};

var generateViewsForB = (generations = [1, 2, 3, 4, 5, 6, 7, 8]) => {
	return generations.map(gen => {
		const viewName = `rq4_b_gen${gen}`;

		return `DROP VIEW IF EXISTS ${viewName}; CREATE VIEW ${viewName} AS ${generateSelectStatementForB(gen)};`
	}).join(' \n\n ');
};

var generateViewsForC = (generations = [1, 2, 3, 4, 5, 6, 7, 8]) => {
	return generations.map(gen => {
		const viewName = `rq4_c_gen${gen}`;

		return `DROP VIEW IF EXISTS ${viewName}; CREATE VIEW ${viewName} AS ${generateSelectStatementForC(gen)};`
	}).join(' \n\n ');
};

var generateViewsForD = (generations = [1, 2, 3, 4, 5, 6, 7, 8]) => {
	return generations.map(gen => {
		const viewName = `rq4_d_gen${gen}`;

		return `DROP VIEW IF EXISTS ${viewName}; CREATE VIEW ${viewName} AS ${generateSelectStatementForD(gen)};`
	}).join(' \n\n ');
};