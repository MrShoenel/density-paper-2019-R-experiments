install.packagesCond <- function(pkg) {
  if (pkg %in% rownames(installed.packages()) == FALSE) {
    install.packages(pkg, repos = "http://cran.us.r-project.org")
  }
}

install.packagesCond("RMariaDB")
library(RMariaDB)

getExperimentConn = function() {
  return(dbConnect(
    RMariaDB::MariaDB(),
    default.file=normalizePath("../my.cnf"),
    group="experiments")
  )
}

getDataset = function(dsName, removeUnwantedColums = TRUE) {
  conn <- getExperimentConn()
  result <- dbSendQuery(conn, paste("SELECT * FROM ", dsName))
  ds <- dbFetch(result)
  
  if (removeUnwantedColums) {
    removeNames <- c("SHA1",
                     #"RepoPathOrUrl",
                     "AuthorName", "CommitterName", "AuthorTime",
                     "CommitterTime", "MinutesSincePreviousCommit", "Message",
                     "AuthorEmail", "CommitterEmail",
                     "AuthorNominalLabel", "CommitterNominalLabel",
                     "ParentCommitSHA1s")
    
    ds <- ds[, !names(ds) %in% removeNames]
  }
  
  dbClearResult(result)
  dbDisconnect(conn)
  return(ds)
}


# Taken from https://stackoverflow.com/questions/10286473/rotating-x-axis-labels-in-r-for-barplot
rotate_x <- function(data, column_to_plot, labels_vec, rot_angle) {
  plt <- barplot(data[[column_to_plot]], col='steelblue', xaxt="n")
  text(plt, par("usr")[3], labels = labels_vec, srt = rot_angle, adj = c(1.1,1.1), xpd = TRUE, cex=0.6) 
}


# Returns a list of tuples of indexes or names of correlated attributes
findCorrelationAttrs <- function(corrMatrix, cutoff = 0.9, names = TRUE) {
  namesRows <- rownames(corrMatrix)
  pairs <- list()
  len <- nrow(corrMatrix)
  for (i in 1:len) {
    for (j in 1:len) {
      if (i == j) {
        next
      }
      if (corrMatrix[i,j] > cutoff) {
        tuple <- c(i, j, corrMatrix[i,j])
        if (names) {
          tuple <- c(namesRows[i], namesRows[j], corrMatrix[i,j])
        }
        pairs[[paste(i, j, sep = "_")]] <- tuple
      }
    }
  }
  return(pairs)
}


predictLevin <- function(leftModel, rightModel, validationSamples) {
  l <- list()
  
  for (row in 1:nrow(validationSamples)) {
    temp <- validationSamples[row, ]
    hasKws <- rowSums(temp[as.vector(
      sapply(colnames(temp), function(x) grepl("^kw_", x)))])[[1]] > 0
    
    if (hasKws) {
      label <- predict(leftModel, temp)[1]
    } else {
      label <- predict(rightModel, temp)[1]
    }
    
    l[[row]] <- label
  }
  
  return(unlist(l))
}


combineVotes <- function(votesLeft, votesRight) {
  l <- list()
  
  for (i in 1:nrow(votesLeft)) {
    temp <- list(
      a = votesLeft[i, "a"] + votesRight[i, "a"],
      c = votesLeft[i, "c"] + votesRight[i, "c"],
      p = votesLeft[i, "p"] + votesRight[i, "p"]
    )
    temp <- temp[order(sapply(temp, max), decreasing = TRUE)]
    
    l[[i]] <- names(temp)[[1]]
  }
  return(as.factor(unlist(l)))
}


predictZeroR <- function(theLabels) {
  # First argument: vector of labels, e.g. from a dataframe
  theFactor <- theLabels
  if (!is.factor(theLabels)) {
    theFactor <- factor(as.character(theLabels), levels = sort(unique(theLabels)))
  }
  
  t <- table(theLabels)
  m <- which.max(t)
  
  return(factor(rep(names(t)[m], length(theLabels)), levels = levels(theFactor)))
}

predictZeroRConfMatrix <- function(labels, trueLabels, retAccOnly = FALSE) {
  trueLabelsFactor <- trueLabels
  if (!is.factor(trueLabelsFactor)) {
    trueLabelsFactor <- factor(as.character(trueLabels), levels = sort(unique(trueLabels)))
  }
  
  labelsFactor <- factor(as.character(labels), levels = levels(trueLabelsFactor))
  
  cm <- confusionMatrix(predictZeroR(labelsFactor), trueLabelsFactor, mode = "everything")
  
  if (retAccOnly) {
    return(cm$overall[["Accuracy"]])
  }
  return(cm)
}


ZeroR <- function(X, targetId) {
  # ZeroR Algorithm: Finds the most commonly occuring class
  # 
  # Args:
  #  X: data frame or Matrix
  #  targetId: response/outcome/target/class feature column number
  
  # Returns:
  #  A vector containing the commonly occuring class value and its count  
  if ( is.character(X[, targetId]) | is.factor(X[, targetId]) ) {
    u.x <- unique(X[, targetId])
    u.x.temp <- c()
    for (i in u.x) {
      u.x.temp <- c(u.x.temp, sum(X[, targetId] == i))
    }
    names(u.x.temp) <- u.x
    return( c(max(u.x.temp), names(u.x.temp)[which.max(u.x.temp)]) ) 
  }
  return(NULL)
}

OneR <- function(X, targetId) {
  error.perc <- c()
  cols <- ncol(X) - 1
  for (f in 1:cols) {
    grps <- unique(X[, f])
    err.count <- c()
    for (grp in grps) {
      grp.data <- X[X[, f] == grp, c(f, targetId)]
      res <- ZeroR(grp.data, 2)
      err.grp <- sum(as.integer(grp.data[, 2] != res[2]))
      err.count <- c(err.count, err.grp)
    }
    error.perc <- c(error.perc, sum(err.count)/nrow(X))
  }
  cat(error.perc)
  cat("\n")
  low.err.idx <- which.min(error.perc)
  return(low.err.idx)
}


runif.sum <- function(n){
  x <- sort(runif(n-1))
  c(x,1) - c(0,x)
}

