import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import PlantLineContribution from "./PlantLineContribution"
import SectionLineContribution from "./SectionLineContribution"
import { Box, Paper, Typography } from "@mui/material";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";


const LineContributionMain = () => {
    return (
        <Container fluid>
            <Box className="cell p-3 mt-3">
                <Row>
                    <Col className="d-flex align-items-center">
                        <Typography variant="h4" component="h4">
                            Line Contribution BD
                        </Typography>
                    </Col>

                    <ChartsToolbar />
                </Row>
            </Box>
            <Row className='mb-5'>

                <Col lg={12} md={12} sm={12}>
                    <PlantLineContribution />
                </Col>
                <Col lg={12} md={12} sm={12}>
                    <SectionLineContribution />
                </Col>
            </Row>
        </Container>
    )
}

export default LineContributionMain